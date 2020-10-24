import { Component, OnInit } from '@angular/core';
import { FileService } from '../file.service';
import {SingleSprite} from '../processrawchararray.service';
@Component({
  selector: 'app-char-rom-viewer',
  templateUrl: './char-rom-viewer.component.html',
  styleUrls: ['./char-rom-viewer.component.css']
})
export class CharRomViewerComponent implements OnInit {

  _text = "choose a file";
  private _fileservice: FileService;
  private _awaitingFileRead: boolean;
  private _LoadedTiles: SingleSprite[];
  public get LoadedTiles(): SingleSprite[] {
    return this._LoadedTiles;
  }
  public set LoadedTiles(value: SingleSprite[]) {
    this._LoadedTiles = value;
  }
  constructor(service: FileService) {
    this._fileservice = service;
    this._awaitingFileRead = false;
  }

  ngOnInit(): void {
  }

  onFilesDropped(e: Event) {
    e.preventDefault();
    if (!this._awaitingFileRead) {
      this._text = "reading...";
      this._fileservice.handleUsersFiles(e.target, this);
      this._awaitingFileRead = true;
    }
  }
  fileReadCallback(result: SingleSprite[], filename: string) {
    
    console.log(result);
    this.LoadedTiles = result;
    this._text = filename;
    this._awaitingFileRead = false;
  }
} 
