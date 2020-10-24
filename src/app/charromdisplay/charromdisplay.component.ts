import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import {SingleSprite }from "../processrawchararray.service";

@Component({
  selector: 'app-charromdisplay',
  templateUrl: './charromdisplay.component.html',
  styleUrls: ['./charromdisplay.component.css']
})
export class CharromdisplayComponent implements OnInit {
  private _scaledtilesize = 24;
  private _ctx;
  private _canvas: HTMLCanvasElement;
  @Input() TileImages: SingleSprite [];
  constructor() { }

  ngOnInit(): void {
    this._canvas = <HTMLCanvasElement>document.getElementById("canvas");
    this._ctx = this._canvas.getContext("2d");
    console.log(this._ctx);
    this._canvas.width = 16 * this._scaledtilesize;
    this._canvas.height = 512;
  }
  ngOnChanges(changes: SimpleChanges) {
    if ("TileImages" in changes) {
      let newcanvas = <HTMLCanvasElement>document.createElement("CANVAS");
      newcanvas.width = 16 * 8;
      newcanvas.height = (this.TileImages.length / 16) * 8;
      let newctx = newcanvas.getContext("2d");
      this._canvas.height = (this.TileImages.length / 16) * this._scaledtilesize;
      let cursor = { x: 0, y: 0 };
      for (let i = 0; i < this.TileImages.length; i++) {
        newctx.putImageData(this.TileImages[i].data, cursor.x, cursor.y);
        cursor.x += 8;
        if (cursor.x == 128) {
          cursor.x = 0;
          cursor.y += 8;
        }
      }
      this._ctx.scale(this._scaledtilesize / 8, this._scaledtilesize/8);
      this._ctx.drawImage(newcanvas, 0, 0);
    }
    
  }
}
