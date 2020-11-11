import { Component,AfterViewInit, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { SpritesData, ROMMetaData, SingleSprite} from '../processrawchararray.service';

@Component({
  selector: 'app-charromdisplay',
  templateUrl: './charromdisplay.component.html',
  styleUrls: ['./charromdisplay.component.css']
})
export class CharromdisplayComponent implements AfterViewInit {
  private _scaledtilesize = 32;
  private _ctx;
  private _canvas: HTMLCanvasElement;
  @Input() TileImages: SpritesData;
  @Output() TileSelectChangeEvent = new EventEmitter<SingleSprite>();
  private _ChosenTile: SingleSprite;
  public get ChosenTile(): SingleSprite{
    return this._ChosenTile
  }

  constructor() { }

  ngAfterViewInit(): void {
    this._canvas = <HTMLCanvasElement>document.getElementById("canvas");
    this._ctx = this._canvas.getContext("2d");
    this._canvas.width = 16 * this._scaledtilesize;
    this._canvas.height = 512;
  }
  ngOnChanges(changes: SimpleChanges) {
    if ("TileImages" in changes) {
      if(this.TileImages != undefined){
        this.setCanvasSize();
        this.drawTiles();
      }
      
    }
  }
  private setCanvasSize(): void{
    this._canvas.height = (this.TileImages.Sprites.length / 16) * this._scaledtilesize;
  }
  private drawTiles(): void{
    let newcanvas = <HTMLCanvasElement>document.createElement("CANVAS");
    newcanvas.width = 16 * 8;
    newcanvas.height = (this.TileImages.Sprites.length / 16) * 8;
    let newctx = newcanvas.getContext("2d");
    let cursor = { x: 0, y: 0 };
    for (let i = 0; i < this.TileImages.Sprites.length; i++) {
      newctx.putImageData(this.TileImages.Sprites[i].ImgData, cursor.x, cursor.y);
      cursor.x += 8;
      if (cursor.x == 128) {
        cursor.x = 0;
        cursor.y += 8;
      }
    }
    this._ctx.scale(this._scaledtilesize / 8, this._scaledtilesize / 8);
    this._ctx.drawImage(newcanvas, 0, 0);
  }
  OnClick(e) {
    if (this.TileImages != undefined) {
      let pos = this.getMousePos(this._canvas,e);
      let xpos = pos.x; 
      let ypos = pos.y; 
      let row = Math.floor(ypos / this._scaledtilesize);
      let col = Math.floor(xpos / this._scaledtilesize);
      let index = (row * 16) + col;
      if (this.TileImages.Sprites.length != 0 && index < this.TileImages.Sprites.length) {
        this._ChosenTile = this.TileImages.Sprites[index];
        this.TileSelectChangeEvent.emit(this._ChosenTile);
        console.log(this.ChosenTile.Index);
      }
    }
  }
  getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
          x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
          y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
      };
  }
}
