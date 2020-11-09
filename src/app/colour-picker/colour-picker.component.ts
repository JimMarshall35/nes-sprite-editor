import { Output, Component, OnInit, EventEmitter } from '@angular/core';
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
  constructor() { }

  ngOnInit(): void {
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
