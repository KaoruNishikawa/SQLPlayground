import { Database, SqlValue } from 'sql.js'
import * as d3 from 'd3'

import { CsvToSqlBridge } from '@/types/csv'


function inferType(values: any[]): { js: (value: any) => SqlValue, sql: string } {
    const numberData = values.map((value) => Number(value))

    if (numberData.every((value) => !isNaN(value) && Number.isInteger(value))) {
        return { js: Number, sql: 'INTEGER' }
    }
    if (numberData.every((value) => !isNaN(value))) {
        return { js: Number, sql: 'DECIMAL' }
    }
    return { js: String, sql: 'VARCHAR' }
    // UInt8Array, which is supported by sql.js, is not supported
}

function convertCsvToSql(name: string, data: any[]): CsvToSqlBridge {
    if (data.length === 0) {
        return { name, create: "", insert: "", values: [] }
    }

    const keys = Object.keys(data[0]).map((key) => key.replace(/[^a-zA-Z0-9]/g, '_'))

    const columns = keys.map((column, index) => {
        const values = data.map((record) => record[column])
        const type = inferType(values)
        console.log(`Column '${column}' has type ${type.sql}`)
        return { column, type, values, index }
    })

    return {
        name,
        create: `CREATE TABLE IF NOT EXISTS ${name} (`
            + columns.map(({ column, type }) => `${column} ${type.sql}`).join(', ')
            + ');',
        insert: `INSERT INTO ${name} `
            + `(${columns.map(({ column }) => column).join(', ')}) VALUES `
            + `(${columns.map(({ index }) => '$' + index).join(', ')})`,
        values: data.map((record) => {
            const mapping: { [key: string]: any } = {}
            for (const { column, index, type } of columns) {
                mapping['$' + index] = type.js(record[column])
            }
            return mapping
        })
    }
}

export async function fillDatabase(
    db: Database, csv: { name: string, data: any[] }
): Promise<void> {
    const parsedCsv = convertCsvToSql(csv.name, csv.data)

    db.run(parsedCsv.create)

    const insertStmt = db.prepare(parsedCsv.insert)
    for (const record of parsedCsv.values) {
        insertStmt.bind(record)
        insertStmt.run()
    }
    insertStmt.free()
}

export async function loadCsvFile(path: string): Promise<any[]> {
    const response = await fetch(path)
    const data = await response.text()
    const parsed = d3.csvParse(data)
    return parsed
}

export function checkIfTableExists(db: Database, tableName: string): boolean {
    const result = db.exec(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
    )
    return result.length > 0
}
