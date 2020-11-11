import { HostListener, Output, Component, OnInit, EventEmitter } from '@angular/core';
import { Colour, Palette} from '../processrawchararray.service';

interface ColourChangeEvent{
  ColourIndex: number;
}
@Component({
  selector: 'app-colour-picker',
  templateUrl: './colour-picker.component.html',
  styleUrls: ['./colour-picker.component.css']
})
export class ColourPickerComponent implements OnInit {

  @Output() ColourChangeEvent = new EventEmitter<ColourChangeEvent>();
  @Output() PaletteIndexChangeEvent = new EventEmitter<number>();
  private _radios;
  constructor() { }

  ngOnInit(): void {
    this._radios = document.body.getElementsByClassName("palette-radio");
  }
  @HostListener('window:keypress', ['$event'])
  public handleKeyPress(event){
    switch(event.key){
        case "0":
          this.selectPaletteCol(0);
          break;
        case "1":
          this.selectPaletteCol(1);
          break;
        case "2":
          this.selectPaletteCol(2);
          break;
        case "3":
          this.selectPaletteCol(3);
          break;
    }
  }
  private selectPaletteCol(index){
    this.clearRadios();
    this.setRadioChecked(index);
    this.PaletteIndexChangeEvent.emit(index);
  }
  private clearRadios(){
    for(let i=0; i<this._radios.length; i++){
      this._radios[i].checked = false;
    }
  }
  private setRadioChecked(index){
    for(let i=0; i<this._radios.length; i++){
      if(i==index){
        this._radios[i].checked = true;
      }
    }
  }
  onPaletteRadioChange(num){
    this.PaletteIndexChangeEvent.emit(num);
  }
  onColourChange(event,num){
  	let hexstring = event.target.value;
    let colour = this.getColourFromHex(hexstring);
    console.log(colour);
  	console.log(num);
    Palette[num] = colour;
    this.ColourChangeEvent.emit({ColourIndex: num});
  }
  getColourFromHex(hex: string): Colour{
      let r = parseInt(hex.slice(1,3),16);
      let g = parseInt(hex.slice(3,5),16);
      let b = parseInt(hex.slice(5,7),16);
      return new Colour(r,g,b,255);
  }
}
