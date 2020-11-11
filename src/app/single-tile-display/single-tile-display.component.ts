
import { HostListener, Component, ElementRef, OnInit,AfterViewInit, ViewChild, Input, Output, EventEmitter, SimpleChanges} from '@angular/core';
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
  @Output() ColourChangedEvent = new EventEmitter();
  private _canvases: HTMLCanvasElement[];
  private _scaledtilesize = 150;
  private _pixelsize;
  private _selectiongriddivs;
  private _currentcanvasindex = 0;
  private _tiles: wrappedSingleSprite[];
  private _selectedIndex: number;
  private GRID_COLS = 4;
  private GRID_ROWS = 4;
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
  private formatHex(num: number): string{
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
    this._selectiongriddivs = document.getElementsByClassName("gridcell");
    this.initCanvases();
    
    this.SelectedIndex = this.formatHex(0);
    this._pixelsize = this._scaledtilesize / 8;
    this._tiles = [];
    this._selectedIndex = 0;

  }
  private setGridDims(rows:number,cols:number){
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
  private initCanvases(): void{
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
  private drawTile(ctx, sprite: SingleSprite): void {
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
      let pos = this.getMousePos(sender,e);
      let xpos = pos.x;
      let ypos = pos.y;
      let row = Math.floor(ypos / this._pixelsize);
      let col = Math.floor(xpos / this._pixelsize);
      let index = (row * 8) + col;
      sprite.PaletteIndices[index] = this._selectedIndex;

      sprite.processPaletteIndicesToBytes();

      this.drawTile(ctx, sprite);
      sprite.processPaletteIndicesToImgData();
      this.PixelChangedEvent.emit(sprite);
    }
    
  }
  private SetSelectionGridWhite(){
    for (var i = 0; i < this._selectiongriddivs.length; ++i) {
        this._selectiongriddivs[i].style.backgroundColor = "white";
    }
  }
  OnCellClick(num: number, element): void{ 
    this.SetSelectionGridWhite();
    element.style.backgroundColor = "red";
    this._currentcanvasindex = num;
    this.setCanvasBorderRed(num);
  }
  private setCanvasBorderRed(index){
    for(let i=0; i<this._canvases.length; i++){
      this._canvases[i].style.borderColor = "grey";
    }
    this._canvases[index].style.borderColor = "red";
  }
  private getSpriteByIndex(index:number): SingleSprite{
    for(let i=0; i<this._tiles.length; i++){
      if(this._tiles[i].index == index){
        return this._tiles[i].sprite;
      }
    }
    return null;
  }
  private getIndexOfCanvas(c: HTMLCanvasElement): number{
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
  private pushToTiles(ssprite: SingleSprite, canvasindex: number): void{
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
  OnColourChanged(event){
     this.redrawAllTiles();
     this.ColourChangedEvent.emit(event);
  }
  private redrawAllTiles(){
      for(let i=0; i<this._tiles.length; i++){
        let tile = this._tiles[i];
        let canvas = this._canvases[tile.index];
        let ctx = canvas.getContext("2d");
        this.drawTile(ctx, tile.sprite);
      }
  }
  OnPaletteIndexChange(num){
      this._selectedIndex = num;
  }
  private getMousePos(canvas, evt) {
      var rect = canvas.getBoundingClientRect();
      return {
          x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
          y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
      };
  }
  @HostListener('window:keypress', ['$event'])
  public handleKeyPress(event){
    /*
      function needs tidying up / refactoring
    */
    switch(event.key){
        case "ArrowUp":
        case "w":
          
          if(this._currentcanvasindex- this.GRID_COLS < 0){
            this._currentcanvasindex = (this.GRID_COLS*this.GRID_ROWS -1)-(this.GRID_COLS-this._currentcanvasindex-1);
            this.OnCellClick(this._currentcanvasindex,this._selectiongriddivs[this._currentcanvasindex]);
            break;
          }
          this._currentcanvasindex -= this.GRID_COLS;
          this.OnCellClick(this._currentcanvasindex,this._selectiongriddivs[this._currentcanvasindex]);
          break;
        case "ArrowDown":
        case "s":
          
          if(this._currentcanvasindex + this.GRID_COLS > this.GRID_COLS*this.GRID_ROWS -1){
            this._currentcanvasindex = (this.GRID_ROWS)-(this.GRID_COLS*this.GRID_ROWS-this._currentcanvasindex);
            this.OnCellClick(this._currentcanvasindex,this._selectiongriddivs[this._currentcanvasindex]);
            break;
          }
          this._currentcanvasindex += this.GRID_COLS;
          this.OnCellClick(this._currentcanvasindex,this._selectiongriddivs[this._currentcanvasindex]);
          break;
        case "ArrowLeft":
        case "a":
          this._currentcanvasindex--;
          if(this._currentcanvasindex < 0){
            this._currentcanvasindex = (this.GRID_COLS*this.GRID_ROWS -1)-(this.GRID_COLS-this._currentcanvasindex);
          }
          this.OnCellClick(this._currentcanvasindex,this._selectiongriddivs[this._currentcanvasindex]);
          break;
        case "ArrowRight":
        case "d":
          this._currentcanvasindex++;
          if(this._currentcanvasindex >this.GRID_COLS*this.GRID_ROWS -1){
            this._currentcanvasindex = (this.GRID_ROWS)-(this.GRID_COLS-this._currentcanvasindex);
          }
          this.OnCellClick(this._currentcanvasindex,this._selectiongriddivs[this._currentcanvasindex]);
          break;
    }
  }
}
