import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges} from '@angular/core';
import { SingleSprite, Palette } from '../processrawchararray.service';
import { Event } from '@angular/router';

@Component({
  selector: 'app-single-tile-display',
  templateUrl: './single-tile-display.component.html',
  styleUrls: ['./single-tile-display.component.css']
})
export class SingleTileDisplayComponent implements OnInit {
  SelectedIndex: string;
  @Input() _SelectedTile: SingleSprite;
  @Output() PixelChangedEvent = new EventEmitter<SingleSprite>();
  private _Canvas: HTMLCanvasElement;
  private _Ctx;
  private _scaledtilesize = 360;
  private _pixelsize;

  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    if ("_SelectedTile" in changes) {
      this.SelectedIndex = this.formatHex(this._SelectedTile.Index);
      this.drawTile();
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
  ngOnInit(): void {
    this._Canvas = <HTMLCanvasElement>document.getElementById("single-tile-display");
    this._Ctx = this._Canvas.getContext("2d");
    this._Canvas.width = this._scaledtilesize;
    this._Canvas.height = this._scaledtilesize;
  }
  drawTile(): void {
    this._Ctx.clearRect(0, 0, this._scaledtilesize, this._scaledtilesize);
    let cursor = { x: 0, y: 0 };
    this._pixelsize = this._scaledtilesize / 8;
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
  OnClick(e): void {
    let xpos = e.layerX;
    let ypos = e.layerY;
    let row = Math.floor(ypos / this._pixelsize);
    let col = Math.floor(xpos / this._pixelsize);
    let index = (row * 8) + col;
    //console.log("row: " + row + " col: " + col);
    //console.log("index: " + index);
    this._SelectedTile.PaletteIndices[index]++;
    if (this._SelectedTile.PaletteIndices[index] > 3) {
      this._SelectedTile.PaletteIndices[index] = 0;
    }
    this._SelectedTile.processPaletteIndicesToBytes();
    this.drawTile();
    this._SelectedTile.processPaletteIndicesToImgData();
    this.PixelChangedEvent.emit(this._SelectedTile);
  }
}
