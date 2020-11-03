
import { Component, OnInit,AfterViewInit, Input, Output, EventEmitter, SimpleChanges} from '@angular/core';
import { SingleSprite, Palette } from '../processrawchararray.service';
import { Event } from '@angular/router';

@Component({
  selector: 'app-single-tile-display',
  templateUrl: './single-tile-display.component.html',
  styleUrls: ['./single-tile-display.component.css']
})
export class SingleTileDisplayComponent implements AfterViewInit {
  SelectedIndex: string;
  @Input() _SelectedTile: SingleSprite;
  @Output() PixelChangedEvent = new EventEmitter<SingleSprite>();
  private _Canvas: HTMLCanvasElement;
  private _Canvases: HTMLCanvasElement[];
  private _Ctx;
  private _scaledtilesize = 250;
  private _pixelsize;
  private _selectiongriddivs;

  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    if ("_SelectedTile" in changes) {
      if(this._SelectedTile != undefined){
        this.SelectedIndex = this.formatHex(this._SelectedTile.Index);
        this.drawTile();
      }
      
    }
  }
  formatHex(num: number): string{
    let str_start = "0x";
    let numstr = num.toString(16);
    if (numstr.length <= 4) {
      while (numstr.length <= 4) {
        numstr = "0" + numstr;
      }
    }
    return str_start + numstr;
  }
  ngAfterViewInit(): void {
    this._Canvas = <HTMLCanvasElement>document.getElementById("single-tile-display");
    this._Ctx = this._Canvas.getContext("2d");
    this._Canvas.width = this._scaledtilesize;
    this._Canvas.height = this._scaledtilesize;
    this.initCanvases();
    this._selectiongriddivs = document.getElementsByClassName("gridcell");
    this.SelectedIndex = this.formatHex(0);
    this._pixelsize = this._scaledtilesize / 8;
    //this.drawTile();
  }
  initCanvases(){
    this._Canvases = [];
    let canvases_result = document.getElementsByClassName("single-canvas");
    for(let i=0; i<canvases_result.length; i++){
      this._Canvases.push(<HTMLCanvasElement>canvases_result[i])
    }
    for(let i=0; i<this._Canvases.length; i++){
      let canvas = this._Canvases[i];
      canvas.width = this._scaledtilesize;
      canvas.height = this._scaledtilesize;
    }
  }
  drawTile(): void {
    this._Ctx.clearRect(0, 0, this._scaledtilesize, this._scaledtilesize);
    let cursor = { x: 0, y: 0 };
    
    for (let i = 0; i < this._SelectedTile.PaletteIndices.length; i++) {
      let index = this._SelectedTile.PaletteIndices[i];
      let colour = Palette[index];
      this._Ctx.fillStyle = colour.getCSSString();
      this._Ctx.fillRect(cursor.x, cursor.y, this._pixelsize, this._pixelsize);
      cursor.x += this._pixelsize;
      if (cursor.x > 7 * this._pixelsize) {
        cursor.x = 0;
        cursor.y += this._pixelsize;
      }
    }
  }
  OnClick(e, sender): void {
    let xpos = e.layerX;
    let ypos = e.layerY;
    let row = Math.floor(ypos / this._pixelsize);
    let col = Math.floor(xpos / this._pixelsize);
    let index = (row * 8) + col;
    this._SelectedTile.PaletteIndices[index]++;
    if (this._SelectedTile.PaletteIndices[index] > 3) {
      this._SelectedTile.PaletteIndices[index] = 0;
    }
    this._SelectedTile.processPaletteIndicesToBytes();
    this.drawTile();
    this._SelectedTile.processPaletteIndicesToImgData();
    this.PixelChangedEvent.emit(this._SelectedTile);
  }
  OnCellClick(num: number, element){
    for (var i = 0; i < this._selectiongriddivs.length; ++i) {
        this._selectiongriddivs[i].style.backgroundColor = "white";
    }
    element.style.backgroundColor = "red";
  }
}
