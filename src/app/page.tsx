'use client'

import React, { useEffect, useState } from 'react'
import Editor from 'react-simple-code-editor'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
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
    const [stashed, setStashed] = useState<string | null>(null)
    const [historyCursor, setHistoryCursor] = useState<number>(-1)

    useEffect(() => {
        async function setupSql() {
            const SQL = await initSqlJs({
                locateFile: () => 'sql-wasm.wasm'
            })
            return new SQL.Database()
        }

        async function load() {
            const _databases: { data: any[], name: string }[] = []
            const fetchingCsv = [
                loadCsvFile('./users.csv').then(data => {
                    _databases.push({ data, name: 'users' })
                }),
                loadCsvFile('./timezones.csv').then(data => {
                    _databases.push({ data, name: 'timezones' })
                }),
                loadCsvFile('./articles.csv').then(data => {
                    _databases.push({ data, name: 'articles' })
                }),
                loadCsvFile('./comments.csv').then(data => {
                    _databases.push({ data, name: 'comments' })
                }),
            ]
            await Promise.all(fetchingCsv)
            setDatabases([...databases, ..._databases])
            return _databases
        }

        function fill(_db: Database, database: { data: any[], name: string }) {
            checkIfTableExists(_db, database.name) || fillDatabase(_db, database)
        }

        load().then(_databases => {
            if (db === null) {
                setupSql().then((_db) => {
                    setDb(_db)
                    _databases.forEach((csv) => fill(_db, csv))
                })
            } else {
                _databases.forEach((csv) => fill(db, csv))
            }
        })

        return db?.close
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

    function handleKeyDown(
        e: React.KeyboardEvent<HTMLTextAreaElement>
            & React.KeyboardEvent<HTMLDivElement>
    ) {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault()
            handleExecute()

            setStashed(null)
            setHistoryCursor(-1)
            return
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (history.length === 0) { return }

            if (historyCursor === -1) {
                setStashed(query)
                setHistoryCursor(history.length - 1)
                setQuery(history[history.length - 1])
            } else if (historyCursor === 0) {
                // Do nothing
            } else if (historyCursor <= history.length - 1) {
                setHistoryCursor(historyCursor - 1)
                setQuery(history[historyCursor - 1])
            }
            return
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (history.length === 0) { return }

            if (historyCursor === -1) {
                // Do nothing
            } else if (historyCursor === history.length - 1) {
                setHistoryCursor(-1)
                setQuery(stashed || '')
                setStashed(null)
            } else if (historyCursor < history.length) {
                setHistoryCursor(historyCursor + 1)
                setQuery(history[historyCursor + 1])
            }
            return
        }
    }

    return (
        <main className={styles.main}>
            <PanelGroup direction='horizontal' className={styles.container}>
                <Panel
                    className={styles.databaseList + ' ' + styles.panel}
                    defaultSizePercentage={15}
                    collapsible={false}
                    minSizePixels={120}
                >
                    <div className='center'>
                        <h2>TABLES</h2>
                    </div>
                    <ul>
                        {databases.map((db, index) => (
                            <li key={index}>{db.name}</li>
                        ))}
                        {/* TODO: Add file drop zone */}
                    </ul>
                </Panel>
                <PanelResizeHandle className={styles.resizeHandle} />
                <Panel
                    className={styles.code + ' ' + styles.panel}
                    defaultSizePercentage={45}
                    collapsible={false}
                >
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
                            onKeyDown={handleKeyDown}
                            tabSize={4}
                            insertSpaces={true}
                            readOnly={false}
                            style={{ overflow: 'visible' }}
                            placeholder='Enter SQLite query here;'
                        />
                    </div>
                    <button
                        type='button'
                        disabled={db === null}
                        onClick={handleExecute}
                        title='Execute query (Shift + Enter)'
                        className={styles.executeButton}
                    >Execute</button>
                    <span className={styles.errorDisplay}>{error}</span>
                </Panel>
                <PanelResizeHandle className={styles.resizeHandle} />
                <Panel
                    className={styles.result + ' ' + styles.panel}
                    defaultSizePercentage={40}
                    collapsible={false}
                >
                    <Table data={result} />
                </Panel>
            </PanelGroup>
        </main>
    )
}
