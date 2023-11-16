export type CsvToSqlBridge = {
    name: string
    create: string
    insert: string
    values: { [key: string]: any }[]
}
