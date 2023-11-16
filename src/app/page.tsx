'use client'

import React, { useEffect, useState } from 'react'
import Editor from 'react-simple-code-editor'
import initSqlJs, { Database } from 'sql.js'
import hljs from 'highlight.js'
import 'highlight.js/styles/xt256.css'

import Table from '@/components/Table'
import styles from './page.module.scss'
import { checkIfTableExists, fillDatabase, loadCsvFile } from '@/features/csvToSql'


export default function Home() {
    const [db, setDb] = useState<Database | null>(null)
    const [query, setQuery] = useState('SELECT * FROM users;')
    const [result, setResult] = useState<any[]>([])
    const [history, setHistory] = useState<string[]>([])
    const [error, setError] = useState('')
    const [databases, setDatabases] = useState<{ data: any[], name: string }[]>([])

    useEffect(() => {
        async function setupSql() {
            const SQL = await initSqlJs({
                locateFile: () => 'https://sql.js.org/dist/sql-wasm.wasm'
            })
            return new SQL.Database()
        }

        function fill(_db: Database, database: { data: any[], name: string }) {
            checkIfTableExists(_db, database.name) || fillDatabase(_db, database)
        }

        if (db === null) {
            setupSql().then((_db) => {
                setDb(_db)
                databases.forEach((csv) => fill(_db, csv))
            })
        } else {
            databases.forEach((csv) => fill(db, csv))
        }
    }, [databases])

    useEffect(() => {
        async function load() {
            const _databases: { data: any[], name: string }[] = []
            await loadCsvFile('./users.csv').then(data => {
                _databases.push({ data, name: 'users' })
            })
            await loadCsvFile('./timezones.csv').then(data => {
                _databases.push({ data, name: 'timezones' })
            })
            await loadCsvFile('./articles.csv').then(data => {
                _databases.push({ data, name: 'articles' })
            })
            await loadCsvFile('./comments.csv').then(data => {
                _databases.push({ data, name: 'comments' })
            })
            setDatabases([...databases, ..._databases])
        }
        load()
    }, [])

    const handleExecute = () => {
        setError('')
        if (db === null) {
            setError('Database loading not finished yet')
            return
        }
        try {
            const stmt = db?.prepare(query)
            const _result: any[] = []
            while (stmt?.step()) {
                _result.push(stmt.getAsObject(null))
            }
            stmt?.free()
            if (query.toLowerCase().startsWith('select')) {
                setResult(_result)
            }
            setHistory([...history, query])
            setQuery('')
        } catch (e) {
            setError(String(e))
        }
    }

    function handleKeyExecute(
        e: React.KeyboardEvent<HTMLTextAreaElement>
            & React.KeyboardEvent<HTMLDivElement>
    ) {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            handleExecute()
        }
    }

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.databaseList}>
                    <div className='center'>
                        <h2>DATABASES</h2>
                    </div>
                    <ul>
                        {databases.map((db, index) => (
                            <li key={index}>{db.name}</li>
                        ))}
                        {/* TODO: Add file drop zone */}
                    </ul>
                </div>
                <div className={styles.code}>
                    <div className={styles.historyContainer}>
                        <Editor
                            value={history.join('\n')}
                            onValueChange={() => { }}
                            highlight={code => hljs.highlight(code, { language: 'sql' }).value.split('\n').map((line, index) => (`<span class="${styles.historyLineNumber}">${line}</span>`)).join('\n')}
                            padding={0}
                            className={styles.history}
                            readOnly={true}
                            style={{ overflow: 'visible' }}
                        // Setting `overflow` in CSS module will be overloaded
                        />
                    </div>
                    <div className={styles.editorContainer}>
                        <Editor
                            value={query}
                            onValueChange={setQuery}
                            highlight={code => hljs.highlight(code, { language: 'sql' }).value.split('\n').map((line, index) => (`<span class="${styles.editorLineNumber}">${line}</span>`)).join('\n')}
                            padding={0}
                            className={styles.editor}
                            onKeyDown={handleKeyExecute}
                            tabSize={4}
                            insertSpaces={true}
                            readOnly={false}
                            style={{ overflow: 'visible' }}
                        />
                    </div>
                    <button
                        type='button'
                        disabled={db === null}
                        onClick={handleExecute}
                    >Execute</button>
                    <span style={{ color: '#f00' }}>{error}</span>
                </div>
                <div className={styles.result}>
                    <Table data={result} />
                </div>
            </div>
        </main>
    )
}
