import { Component, OnInit } from '@angular/core';
import { FileService } from '../file.service';
import { SpritesData, SingleSprite } from '../processrawchararray.service';

@Component({
  selector: 'app-char-rom-viewer',
  templateUrl: './char-rom-viewer.component.html',
  styleUrls: ['./char-rom-viewer.component.css']
})
export class CharRomViewerComponent implements OnInit {
  _RomInfoText = "";
  _TitleText = "choose a file";
  private _fileservice: FileService;
  private _awaitingFileRead: boolean;
  private _LoadedTiles: SpritesData;
  public get LoadedTiles(): SpritesData {
    return this._LoadedTiles;
  }
  private _SelectedTile: SingleSprite;
  public get SelectedTile(): SingleSprite {
    return this._SelectedTile;
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
      this._TitleText = "reading...";
      this._fileservice.handleUsersFiles(e.target, this);
      this._awaitingFileRead = true;
    }
  }
  fileReadCallback(result: SpritesData) {
    console.log(result);
    this._LoadedTiles = result;
    this._TitleText = result.MetaData.FileName;
    this._RomInfoText = "prg rom: " + result.MetaData.PrgROMSizeBytes / 1024 + "kb  \n" +
                        "chr rom: " + result.MetaData.ChrROMSizeBytes / 1024 + "kb  \n" +
                        "Trainer: " + result.MetaData.Trainer.toString();
    this._awaitingFileRead = false;
  }
  OnTileSelectionChange(e: SingleSprite) {
    this._SelectedTile = e;
  }
  OnPixelChanged(e: SingleSprite) {
    this._LoadedTiles.Sprites[e.Index] = e;
    console.log("pixel changed");
    this.makeChangesVisibileToChild();
    console.log(this._LoadedTiles.Sprites[e.Index].PaletteIndices);
  }
  private makeChangesVisibileToChild() {
    // simply changing a property on _LoadedTiles
    // is not enough for that property to change on
    // child components that use @input - the whole object must be set again
    let newobj = new SpritesData();
    Object.assign(newobj, this._LoadedTiles);
    this._LoadedTiles = newobj;
  }
  OnDownloadButtonClick() {
    if (this._LoadedTiles != undefined) {
      this._LoadedTiles.repackEditedSprites();
      this._fileservice.downloadFile(this._LoadedTiles.ROM, this.LoadedTiles.MetaData.FileName.slice(0,-4) + "_edited.nes", "application/x-nes-rom");
    }
  }
  OnColourChange(event){
    for(let i=0; i<this._LoadedTiles.Sprites.length; i++){
      this._LoadedTiles.Sprites[i].processPaletteIndicesToImgData();
    }
    this.makeChangesVisibileToChild();
  }
} 

