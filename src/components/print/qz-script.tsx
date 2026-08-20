'use client'

import Script from 'next/script'

export function QzScript() {
  return (
    <>
      <Script src="https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js" strategy="afterInteractive" />
    </>
  )
}