import type { ReactNode } from 'react'

import styles from './Table.module.scss'


export default function Table({ data }: { data: any[] }): ReactNode {
    const columns = data.length > 0 ? Object.keys(data[0]) : []
    return (
        <>
            <div className={styles.container}>
                <table>
                    <thead>
                        <tr>
                            {columns.map((column, index) => <th key={index}>{column}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index}>
                                {columns.map((column, index) => (
                                    <td key={index}>{row[column]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

            </div>
            <div className={styles.nRecords}>
                <span>{data.length} Records</span>
            </div>
        </>
    )
}
