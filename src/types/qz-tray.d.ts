declare module 'qz-tray' {
    type PrintConfig = object
    interface QzApi {
        websocket: { isActive(): boolean; connect(options?: { retries?: number; delay?: number }): Promise<void> }
        printers: { find(query?: string): Promise<string | string[]> }
        configs: { create(printer: string, options?: { encoding?: string }): PrintConfig }
        print(config: PrintConfig, data: string[]): Promise<void>
    }
    const qz: QzApi
    export = qz
}
