import { Injectable } from '@angular/core';
import { ProcessrawchararrayService, SpritesData } from './processrawchararray.service';



interface ServiceClient{
  fileReadCallback: (imgdata: SpritesData) => void;
}
@Injectable({
  providedIn: 'root'
})
export class FileService {
  private _arrayprocessor: ProcessrawchararrayService;
  constructor(service: ProcessrawchararrayService) {
    this._arrayprocessor = service;
  }
  public async handleUsersFiles(event, client: ServiceClient): Promise<boolean>{
    let filename = event.files[0].name;
    let fileextention = filename.substring(filename.length - 4);
    if (event.files.length != 1) {
      return false;
    }
    let file = event.files[0];
    let buffer = await file.arrayBuffer();
    let uint8arr = new Uint8Array(buffer);
    let spritedata;
    switch (fileextention) {
      case ".chr":
        spritedata = this._arrayprocessor.processCharRomToImageData(uint8arr);
        spritedata.MetaData.FileName = file.name;
        client.fileReadCallback(spritedata);
        return true;
      case ".nes":
        spritedata = this._arrayprocessor.processNESRomToImageData(uint8arr);
        spritedata.MetaData.FileName = file.name;
        client.fileReadCallback(spritedata);
        return true;
      default:
        return false;
    }
  }
  public downloadFile(data, filename, mime) {
  // note from jim - this function is copied from https://gist.github.com/davalapar/d0a5ba7cce4bc599f54800da22926da2

  // It is necessary to create a new blob object with mime-type explicitly set
  // otherwise only Chrome works like it should
  const blob = new Blob([data], { type: mime || 'application/octet-stream' });
  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    // IE doesn't allow using a blob object directly as link href.
    // Workaround for "HTML7007: One or more blob URLs were
    // revoked by closing the blob for which they were created.
    // These URLs will no longer resolve as the data backing
    // the URL has been freed."
    window.navigator.msSaveBlob(blob, filename);
    return;
  }
  // Other browsers
  // Create a link pointing to the ObjectURL containing the blob
  const blobURL = window.URL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.style.display = 'none';
  tempLink.href = blobURL;
  tempLink.setAttribute('download', filename);
  // Safari thinks _blank anchor are pop ups. We only want to set _blank
  // target if the browser does not support the HTML5 download attribute.
  // This allows you to download files in desktop safari if pop up blocking
  // is enabled.
  if (typeof tempLink.download === 'undefined') {
    tempLink.setAttribute('target', '_blank');
  }
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  setTimeout(() => {
    // For Firefox it is necessary to delay revoking the ObjectURL
    window.URL.revokeObjectURL(blobURL);
  }, 100);
}
}
