
import { Component, ElementRef, OnInit,AfterViewInit, ViewChild, Input, Output, EventEmitter, SimpleChanges} from '@angular/core';
import { SingleSprite, Palette } from '../processrawchararray.service';
import { Event } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
interface wrappedSingleSprite{
  index : number;        // which canvas to draw on
  sprite : SingleSprite; //sprite to draw
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
  private _canvases: HTMLCanvasElement[];
  private _scaledtilesize = 250;
  private _pixelsize;
  private _selectiongriddivs;
  private _currentcanvasindex = 0;
  private _tiles: wrappedSingleSprite[];
  @ViewChild("selectgrid") private _selectgrid: ElementRef;
  @ViewChild("canvasgrid") private _canvasgrid: ElementRef;

  constructor(private sanitizer: DomSanitizer) { }
  ngOnChanges(changes: SimpleChanges): void {
    if ("_SelectedTile" in changes) {
      if(this._SelectedTile != undefined){
        this.SelectedIndex = this.formatHex(this._SelectedTile.Index);
        let ctx = this._canvases[this._currentcanvasindex].getContext("2d");
        this.drawTile(ctx, this._SelectedTile);
        this.pushToTiles(this._SelectedTile,this._currentcanvasindex);
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
    //this._selectgrid = document.getElementById("select-grid");
    //this._canvasgrid = document.getElementById("canvas-grid");
    this._selectiongriddivs = document.getElementsByClassName("gridcell");
    //this.setGridDims(4,4);
    this.initCanvases();
    
    this.SelectedIndex = this.formatHex(0);
    this._pixelsize = this._scaledtilesize / 8;
    this._tiles = [];

  }
  setGridDims(rows:number,cols:number){
    this._selectgrid.nativeElement.innerHTML = "";
    this._canvasgrid.nativeElement.innerHTML = "";
    let newselect = "";
    let newcanvas = "";
    for(let row=0; row<rows; row++){
      newselect += '<div class="gridrow">';
      newcanvas += '<div class="gridrow">';
      for(let col=0; col<cols; col++){
        newselect += '<div class="gridcell" (click)="OnCellClick('+col+', $event.target)"></div>';
        newcanvas += '<canvas class="single-canvas"(click)="OnClick($event, $event.target)"></canvas>';
      }
      newselect += '</div>';
      newcanvas += '</div>';
    }
    this._selectgrid.nativeElement.innerHTML = newselect;
    this._canvasgrid.nativeElement.innerHTML = newcanvas;
    this._selectiongriddivs = document.getElementsByClassName("gridcell");
  }
  initCanvases(): void{
    this._canvases = [];
    let canvases_result = document.getElementsByClassName("single-canvas");
    for(let i=0; i<canvases_result.length; i++){
      this._canvases.push(<HTMLCanvasElement>canvases_result[i])
    }
    for(let i=0; i<this._canvases.length; i++){
      let canvas = this._canvases[i];
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
  OnCellClick(num: number, element): void{ 
    for (var i = 0; i < this._selectiongriddivs.length; ++i) {
        this._selectiongriddivs[i].style.backgroundColor = "white";
    }
    element.style.backgroundColor = "red";
    this._currentcanvasindex = num;
  }
  getSpriteByIndex(index:number): SingleSprite{
    for(let i=0; i<this._tiles.length; i++){
      if(this._tiles[i].index == index){
        return this._tiles[i].sprite;
      }
    }
    return null;
  }
  getIndexOfCanvas(c: HTMLCanvasElement): number{
    /*
      get the index of a canvas in this._canvases 
      from a reference to that canvas (eg from click event)
    */
      for (var i = 0; i < this._canvases.length; i++) {
        if(c == this._canvases[i]){
          return i;
        }
      }
      return null;
  }
  pushToTiles(ssprite: SingleSprite, canvasindex: number): void{
    /* 
      ensures there are never two objects in
      this._tiles with the same canvas index
    */
    for (var i = 0; i < this._tiles.length; i++) {
      if(this._tiles[i].index == canvasindex){
        this._tiles.splice(i,1,{index:canvasindex, sprite:ssprite});
        return;
      }
    }
    this._tiles.push({index:canvasindex, sprite:ssprite});
  }
}
