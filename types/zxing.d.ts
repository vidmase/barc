declare module '@zxing/library' {
  export class BrowserMultiFormatReader {
    constructor(hints?: Map<any, any>)
    listVideoInputDevices(): Promise<MediaDeviceInfo[]>
    decodeFromVideoDevice(
      deviceId: string,
      videoElement: HTMLVideoElement,
      callback: (result?: any, error?: any) => void
    ): Promise<{ stop: () => void }>
    reset(): void
  }

  export enum DecodeHintType {
    TRY_HARDER = 'TRY_HARDER',
    POSSIBLE_FORMATS = 'POSSIBLE_FORMATS'
  }

  export enum BarcodeFormat {
    CODE_128 = 'CODE_128',
    CODE_39 = 'CODE_39',
    CODE_93 = 'CODE_93',
    EAN_13 = 'EAN_13',
    EAN_8 = 'EAN_8',
    UPC_A = 'UPC_A',
    UPC_E = 'UPC_E',
    QR_CODE = 'QR_CODE',
    DATA_MATRIX = 'DATA_MATRIX'
  }

  export class NotFoundException extends Error {}
  export class Exception extends Error {}
  
  export interface Result {
    getText(): string
  }
}