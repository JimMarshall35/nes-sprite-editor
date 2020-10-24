import { Injectable } from '@angular/core';
import { ProcessrawchararrayService } from './processrawchararray.service';



interface ServiceClient{
  fileReadCallback: (ArrayBuffer, string) => void;
}
@Injectable({
  providedIn: 'root'
})
export class FileService {
  _arrayprocessor: ProcessrawchararrayService;
  constructor(service: ProcessrawchararrayService) {
    this._arrayprocessor = service;
  }
  async handleUsersFiles(event, client: ServiceClient): Promise<boolean>{
    let filename = event.files[0].name;
    let fileextention = filename.substring(filename.length - 4);

    if (event.files.length != 1) {
      return false;
    }
    let file = event.files[0];
    let buffer = await file.arrayBuffer();
    let uint8arr = new Uint8Array(buffer);
    let tiles_imgdata;
    switch (fileextention) {
      case ".chr":
        
        tiles_imgdata = this._arrayprocessor.processCharRomToImageData(uint8arr);
        //console.log(tiles_imgdata);
        client.fileReadCallback(tiles_imgdata, file.name);
        return true;
      case ".nes":
        tiles_imgdata = this._arrayprocessor.processNESRomToImageData(uint8arr);
        client.fileReadCallback(tiles_imgdata, file.name);
        return true;
      default:
        break;
    }
    

  }

}
