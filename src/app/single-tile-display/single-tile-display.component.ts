
import { Component, OnInit,AfterViewInit, Input, Output, EventEmitter, SimpleChanges} from '@angular/core';
import { SingleSprite, Palette } from '../processrawchararray.service';
import { Event } from '@angular/router';

interface wrappedSingleSprite{
  index : number;
  sprite : SingleSprite;
}
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
  private _Ctx: CanvasRenderingContext2D;
  private _scaledtilesize = 250;
  private _pixelsize;
  private _selectiongriddivs;
  private _currentcanvasindex = 0;
  private _tiles: wrappedSingleSprite[];

  constructor() { }
  ngOnChanges(changes: SimpleChanges): void {
    if ("_SelectedTile" in changes) {
      if(this._SelectedTile != undefined){
        this.SelectedIndex = this.formatHex(this._SelectedTile.Index);
        let ctx = this._Canvases[this._currentcanvasindex].getContext("2d");
        this.drawTile(ctx, this._SelectedTile);
        //let newobj = new SingleSprite(null,null);
        //Object.assign(newobj, this._SelectedTile);
        this.pushToTiles(this._SelectedTile,this._currentcanvasindex);
        //this._tiles.push({index : this._currentcanvasindex, sprite : this._SelectedTile})
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
    this._tiles = [];
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
  drawTile(ctx, sprite: SingleSprite): void {
    ctx.clearRect(0, 0, this._scaledtilesize, this._scaledtilesize);
    let cursor = { x: 0, y: 0 };
    
    for (let i = 0; i < sprite.PaletteIndices.length; i++) {
      let index = sprite.PaletteIndices[i];
      let colour = Palette[index];
      ctx.fillStyle = colour.getCSSString();
      ctx.fillRect(cursor.x, cursor.y, this._pixelsize, this._pixelsize);
      cursor.x += this._pixelsize;
      if (cursor.x > 7 * this._pixelsize) {
        cursor.x = 0;
        cursor.y += this._pixelsize;
      }
    }
  }
  OnClick(e, sender): void {
    let c_index = this.getIndexOfCanvas(sender);
    let ctx = <HTMLCanvasElement>sender.getContext("2d");
    let sprite = this.getSpriteByIndex(c_index);
    if(sprite != null){
      let xpos = e.layerX;
      let ypos = e.layerY;
      let row = Math.floor(ypos / this._pixelsize);
      let col = Math.floor(xpos / this._pixelsize);
      let index = (row * 8) + col;
      sprite.PaletteIndices[index]++;
      if (sprite.PaletteIndices[index]>3) {
        sprite.PaletteIndices[index] = 0;
      }
      sprite.processPaletteIndicesToBytes();

      this.drawTile(ctx, sprite);
      sprite.processPaletteIndicesToImgData();
      this.PixelChangedEvent.emit(sprite);
    }
    
  }
  OnCellClick(num: number, element){
    for (var i = 0; i < this._selectiongriddivs.length; ++i) {
        this._selectiongriddivs[i].style.backgroundColor = "white";
    }
    element.style.backgroundColor = "red";
    this._currentcanvasindex = num;
  }
  getSpriteByIndex(index:number){
    for(let i=0; i<this._tiles.length; i++){
      if(this._tiles[i].index == index){
        return this._tiles[i].sprite;
      }
    }
    return null;
  }
  getIndexOfCanvas(c: HTMLCanvasElement){
      for (var i = 0; i < this._Canvases.length; i++) {
        if(c == this._Canvases[i]){
          return i;
        }
      }
      return null;
  }
  pushToTiles(ssprite: SingleSprite, canvasindex: number){
    for (var i = 0; i < this._tiles.length; i++) {
      if(this._tiles[i].index == canvasindex){
        this._tiles.splice(i,1,{index:canvasindex, sprite:ssprite})
        return;
      }
    }
    this._tiles.push({index:canvasindex, sprite:ssprite});
  }
}
