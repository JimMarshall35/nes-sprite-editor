import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CharRomViewerComponent } from './char-rom-viewer/char-rom-viewer.component';
import { FileService } from './file.service';
import { ProcessrawchararrayService } from './processrawchararray.service';
import { CharromdisplayComponent } from './charromdisplay/charromdisplay.component';

@NgModule({
  declarations: [
    AppComponent,
    CharRomViewerComponent,
    CharromdisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [FileService, ProcessrawchararrayService],
  bootstrap: [AppComponent]
})
export class AppModule { }