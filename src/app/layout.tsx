import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { Inter } from 'next/font/google'

import logo from '@/../public/logo.svg'
import './globals.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'SQL Playground',
    description: 'Static SQL playground',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang='en'>
            <body className={inter.className}>
                <header
                    style={{ height: '3em', width: '100vw', background: '#00f7', padding: 0 }}
                >
                    <div className='center' style={{ width: '100%', height: '100%' }}>
                        <Image
                            src={logo}
                            style={{ height: '65%', width: 'auto' }}
                            alt='SQL Playground Logo'
                            priority={true}
                        />
                    </div>
                </header>
                {children}
            </body>
        </html>
    )
}
