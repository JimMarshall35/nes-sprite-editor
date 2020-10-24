
class Colour {
  constructor(public r: number,
              public g: number,
              public b: number,
              public a: number,) {}
}
let Palette = [
  new Colour(0, 0, 0, 255),
  new Colour(0, 255, 0, 255),
  new Colour(0, 0, 255, 255),
  new Colour(255, 0, 0, 255)
];
export class SingleSprite{
  constructor(public data : ImageData,
              public index : number){

  }
}

export class ProcessrawchararrayService {

  constructor() { }
  processNESRomToImageData(array: Uint8Array): SingleSprite[] {
    console.log(array[4] + " * 16kb prg rom");
    console.log(array[5] + " * 8kb chr rom");
    let sliced = [];
    let prg_rom_size = array[4] * 16384;
    let chr_rom_size = array[5] * 8192;
    let chr_rom_start_offset = 16 + prg_rom_size; // 16 byte ines header
    if ((array[6] & 0b00000100) != 0) {     
      chr_rom_start_offset += 512;                // add 512 bytes to offset if trainer present
    }
    for (let i = chr_rom_start_offset; i < chr_rom_start_offset + chr_rom_size; i++) {
      sliced.push(array[i]);
    }
    let sliced_uint8 = new Uint8Array(sliced);
    return this.processCharRomToImageData(sliced_uint8);
  }

  processCharRomToImageData(array: Uint8Array): SingleSprite[] {
    let returnarray = [];
    let index = 0;
    for (let i = 0; i < array.length; i += 16) { // one full loop = 1 sprite (16 bits)
      let imgdatawritepos = 0;
      let sprite = new ImageData(8, 8);
      for (let j = 0; j < 8; j++) {             // one turn of loop = 1 row of pixels
        let byte1 = array[i + j];
        let byte2 = array[i + j + 8];
        for (let pow = 7; pow >= 0; pow--) {  // 2^0 = 0b00000001, 2^1 = 0b00000010, 2^2 = 0b00000100... ect
                                              // test each bit 
          let mask = Math.pow(2, pow);
          let tilenum = 0;
          if ((byte2 & mask) > 0) {
            tilenum += 1;
          }
          if ((byte1 & mask) > 0) {
            tilenum += 2;
          }
          let pxlcolour = Palette[tilenum];
          sprite.data[imgdatawritepos] = pxlcolour.r;
          imgdatawritepos++;
          sprite.data[imgdatawritepos] = pxlcolour.g;
          imgdatawritepos++;
          sprite.data[imgdatawritepos] = pxlcolour.b;
          imgdatawritepos++;
          sprite.data[imgdatawritepos] = pxlcolour.a;
          imgdatawritepos++;
        }
      }
      let obj = new SingleSprite(sprite,index);
      returnarray.push(obj);
      index++;
    }
    return returnarray;
  }
}
