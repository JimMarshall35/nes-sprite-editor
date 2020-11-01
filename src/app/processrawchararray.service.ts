export class SingleSprite {
  private _PaletteIndices: number[];
  public get PaletteIndices(): number[] {      // - indices into the pallet array for each pixel
    return this._PaletteIndices                // - public get, private set
  }
  private _ImgData: ImageData;
  public get ImgData(): ImageData {            // - processed image data ready to be drawn to canvas
    return this._ImgData;                      // - public get, private set
  }
  public get Bytes(): Uint8Array {             // - 16 bytes == 1 sprite
    return this._Bytes;
  }
  constructor(
    public Index: number,                      // - index of this sprite in the chr rom
    private _Bytes: Uint8Array                 
  ) {      
    this.processBytesToPaletteIndices();       // - initialize palette indices 
    this.processPaletteIndicesToImgData();     // - initialize imgdata from palette indices
  }
  private processBytesToPaletteIndices() : void{
    this._PaletteIndices = [];
    for (let j = 0; j < 8; j++) {
      let byte1 = this._Bytes[j];
      let byte2 = this._Bytes[j + 8];
      for (let pow = 7; pow >= 0; pow--){
        let mask = Math.pow(2, pow);
        let tilenum = 0;
        if ((byte2 & mask) > 0) {
          tilenum += 1;
        }
        if ((byte1 & mask) > 0) {
          tilenum += 2;
        }
        this._PaletteIndices.push(tilenum);
      }
    }
  }
  public processPaletteIndicesToImgData(): void{
    let imgdatawritepos = 0;
    this._ImgData = new ImageData(8, 8);
    for (let i = 0; i < this.PaletteIndices.length; i++) {
      let tilenum = this.PaletteIndices[i];
      let pxlcolour = Palette[tilenum];
      this._ImgData.data[imgdatawritepos] = pxlcolour.r;
      imgdatawritepos++;
      this._ImgData.data[imgdatawritepos] = pxlcolour.g;
      imgdatawritepos++;
      this._ImgData.data[imgdatawritepos] = pxlcolour.b;
      imgdatawritepos++;
      this._ImgData.data[imgdatawritepos] = pxlcolour.a;
      imgdatawritepos++;
    }
  }
  public processPaletteIndicesToBytes(): void {
    let row = 0;
    let pixel = 0;
    let newbytes = new Uint8Array(16);
    for (let i = 0; i < this.PaletteIndices.length; i++) {
      let index = this.PaletteIndices[i];
      let byte1_ind = row;
      let byte2_ind = byte1_ind + 8;
      switch (index) {
        case 0:
          break;
        case 1:
          newbytes[byte2_ind] |= Math.pow(2, (7 - pixel));
          break;
        case 2:
          newbytes[byte1_ind] |= Math.pow(2, (7 - pixel));
          break;
        case 3:
          newbytes[byte1_ind] |= Math.pow(2, (7 - pixel));
          newbytes[byte2_ind] |= Math.pow(2, (7 - pixel));
          break;
      }
      pixel++;
      if (pixel > 7) {
        pixel = 0;
        row++;
      }
    }
    this._Bytes = newbytes;
    this.processBytesToPaletteIndices();
  }
}
export class ROMMetaData {
  public FileName:        string;
  public ChrROMSizeBytes: number;
  public PrgROMSizeBytes: number;
  public ChrROMOffset:    number;
  public Trainer:         boolean; // is a trainer present (if so an extra 512 bytes before chr rom data begins)
  constructor() {}
}
export class SpritesData {
  public ROM:        Uint8Array;
  public Sprites:    SingleSprite[]; 
  public MetaData:   ROMMetaData;
  constructor() {
    this.Sprites = [];
  }
  public repackEditedSprites(): void {
    let start = this.MetaData.ChrROMOffset;
    let end = this.MetaData.ChrROMOffset + this.MetaData.ChrROMSizeBytes -1;
    let onsprite = 0;
    let onbyte = 0;
    for (let i = start; i <= end; i++) {
      this.ROM[i] = this.Sprites[onsprite].Bytes[onbyte];
      onbyte++;
      if (onbyte == 16) {
        onbyte = 0;
        onsprite++;
      }
    }
  }
}
class Colour {
  constructor(public r: number,
              public g: number,
              public b: number,
              public a: number) { }
  getCSSString(): string {
    return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
  }

}
export var Palette = [
  new Colour(0, 0, 0, 255),
  new Colour(0, 255, 0, 255),
  new Colour(0, 0, 255, 255),
  new Colour(255, 0, 0, 255)
];

export class ProcessrawchararrayService {

  constructor() { }
  public processNESRomToImageData(array: Uint8Array): SpritesData {
    let meta = new ROMMetaData();
    let chr_rom = this.extractCHRROMFromNES(array, meta);
    let rdata = this.processCharRomToImageData(chr_rom);
    rdata.MetaData = meta;
    rdata.ROM = array;
    return rdata;
  }
  private extractCHRROMFromNES(array: Uint8Array, meta: ROMMetaData): Uint8Array {
    console.log(array[4] + " * 16kb prg rom");
    console.log(array[5] + " * 8kb chr rom");
    let sliced = [];
    let prg_rom_size = array[4] * 16384;
    let chr_rom_size = array[5] * 8192;
    let chr_rom_start_offset = 16 + prg_rom_size; // 16 byte ines header
    meta.Trainer = false;
    if ((array[6] & 0b00000100) != 0) {           
      chr_rom_start_offset += 512;                // add 512 bytes to offset if trainer present
      meta.Trainer = true;
    }
    for (let i = chr_rom_start_offset; i < chr_rom_start_offset + chr_rom_size; i++) {
      sliced.push(array[i]);
    }
    let sliced_uint8 = new Uint8Array(sliced);
    meta.ChrROMOffset = chr_rom_start_offset;
    meta.ChrROMSizeBytes = chr_rom_size;
    meta.PrgROMSizeBytes = prg_rom_size;
    return sliced_uint8;
  }
  public processCharRomToImageData(array: Uint8Array): SpritesData {
    let returndata = new SpritesData();
    for (let i = 0; i < array.length; i += 16) {
      let bytes = new Uint8Array(16);
      for (let j = 0; j < 16; j++) {
        bytes[j] = array[i + j];
      }
      returndata.Sprites.push(new SingleSprite(i / 16, bytes));
    }
    return returndata;
  }

}
