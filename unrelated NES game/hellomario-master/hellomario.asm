
.macro modulo count1, count2 
.proc
	LDA count1
	SEC
label:
	SBC count2
	BCS label
	ADC count1 
.endproc
.endmacro

PPUCTRL = $2000        ; ppu registers
PPUMASK = $2001
PPUSTATUS = $2002
OAMADDR = $2003
OAMDATA = $2004
PPUSCROLL = $2005
PPUADDR = $2006
PPUDATA = $2007
OAMDMA = $4014

SineTableLen = $20
floorypos = $CC

.segment "HEADER"
	.byte "NES"
	.byte $1a
	.byte $02                                   ; 2 * 16KB PRG ROM
	.byte $01                                   ; 1 * 8KB CHR ROM
	.byte %00000001                             ; mapper and mirroring
	.byte $00
	.byte $00
	.byte $00
	.byte $00
	.byte $00, $00, $00, $00, $00               ; filler bytes

.segment "ZEROPAGE" ; LSB 0 - FF
	world: .res 2
	framepointer: .res 2
	xscroll: .res 1
	onframe: .res 1
	loadingonscreen: .res 1
	onnametablescrolling: .res 1
	onmapscreen: .res 1
	movement: .res 1                           ; 0 = stationary, 1 = right, 2 = left
	slowruncntr : .res 1;
	isjumping: .res 1
	jumpamnt: .res 1
	jumpindex: .res 1
	columnptr: .res 2
	columnctr: .res 1                         ; counts up each pixel scrolled. when reaches 8, column pointer by 1 increases
	vramaddr: .res 2
.segment "STARTUP"
	
	Reset:
	    SEI                  ; Disables all interrupts
	    CLD                  ; disable decimal mode

	                         ; Disable sound IRQ
	    LDX #$40
	    STX $4017

	                          ; Initialize the stack register
	    LDX #$FF
	    TXS

	    INX                   ; #$FF + 1 => #$00

	                          ; Zero out the PPU registers
	    STX PPUCTRL
	    STX PPUMASK

	    STX $4010

	:
	    BIT PPUSTATUS
	    BPL :-

	    TXA

	CLEARMEM:
	    STA $0000, X          ; $0000 => $00FF
	    STA $0100, X          ; $0100 => $01FF
		STA $0300, X
	    STA $0400, X
	    STA $0500, X
	    STA $0600, X
	    STA $0700, X
	    LDA #$FF
	    STA $0200, X          ; $0200 => $02FF ; $0200 - $02FF memory for sprites
	    LDA #$00
	    INX
	    BNE CLEARMEM    
	                           ; wait for vblank
	:
	    BIT PPUSTATUS
	    BPL :-

	    LDA #$02
	    STA OAMDMA
	    NOP

	    ; set ppu address to $3F00
	    LDA #$3F
	    STA PPUADDR
	    LDA #$00
	    STA PPUADDR

	    LDX #$00
;================================================================================================
	LoadPalettes:            ; load to ppu just once
	    LDA PaletteData, X
	    STA PPUDATA          ; $3F00, $3F01, $3F02 => $3F1F 
	    INX
	    CPX #$20
	    BNE LoadPalettes    
	                         ; initialize world variable to point to world data (world.bin)
	    LDA #<WorldData      ; get low byte of address of world data
	    STA world            ; store in world variable
	    LDA #>WorldData      ; get high byte
	    STA world + 1        ; store

	                         ; setup address in PPU for nametable data
	    BIT PPUSTATUS        ; reset PPU adress  for second write ( after using $2006 to load palettes)
	    LDA #$20
	    STA PPUADDR
	    LDA #$00
	    STA PPUADDR

	    LDX #$00 
	    LDY #$00

;================================================================================================
	LoadWorld:
		LDA (world), y
		STA PPUDATA
		INY
		CPX #$03 ;x = msb
		BNE :+
		CPY #$C0 ;y = lsb
		BEQ DoneLoadingWorld
	:	
		CPY #$0
		BNE LoadWorld
		INX
		INC world+1      ; increment high byte of world variable
		JMP LoadWorld
	DoneLoadingWorld:		
		INC world+1
	    LDX #$00
	SetAttributes:       ; fill attribute array (last 64 bytes of nametable) 
		LDA #$55         ; in this case, with value $55 to use pallet 
		STA PPUDATA
		INX
		CPX #$40
		BNE SetAttributes

		INC loadingonscreen
		LDX #$00
		LDY #$00

		LDA #<WorldData2
		STA world
		LDA #>WorldData2
		STA world + 1

		LDA #$02
		CMP loadingonscreen
		BNE LoadWorld

		LDA #<WorldData3    ; initialize columnptr to point to first column of screen 3
		STA columnptr
		LDA #>WorldData3
		STA columnptr + 1

		LDA #$20           ; reset ppu address to start of top left nametable
		STA vramaddr
		LDA #$00
		STA vramaddr + 1

		LDA vramaddr            
	    STA PPUADDR
	    LDA vramaddr + 1
	    STA PPUADDR

;================================================================================================
	LoadSprites:                 ; load to memory page $02 to be used each nmi call (OAMDMA)
	    LDA SpriteData, X    
	    STA $0200, X
	    INX
	    CPX #$20
	    BNE LoadSprites    

		; Enable interrupts
	    CLI

	    LDA #%10010000           ; enable NMI change background to use second chr set of tiles ($1000)
	    STA PPUCTRL
	                             ; Enabling sprites and background for left-most 8 pixels
	                             ; Enable sprites and background
	    LDA #%00011110
	    STA PPUMASK

	Loop:
	    JMP Loop

;================================================================================================
	NMI:
	    LDA #$02                  ; copy sprite data from $0200 => PPU memory for display
	    STA OAMDMA
	    JSR LoadNextColumnToPPU
	    INC xscroll
	    LDA xscroll
	    STA PPUSCROLL
	    LDA #$00                   ; don't scroll y
	    STA PPUSCROLL
	GetNameTableMask:
	    LDA #$00                   ; check if scroll has overflowed back to zero
	    CMP xscroll 
	    BNE :+
	    INC onmapscreen
	    
	    LDA #$00
	    CMP onnametablescrolling
	    BNE notzero
	    LDA #$01                   ; if xscroll overflowed to zero toggle onnametablescrolling between zero and one
	    STA onnametablescrolling
	    BNE :+
	notzero:
		LDA #$00
		STA onnametablescrolling
	:
		
	SetPPUCTRl:
		LDA #%10010100                 ; set the last 2 bits of ppuctrl ppu register to either 
		ORA onnametablescrolling       ; 0 for nametable $2000 or 1 for $2400 (other two nametables are accessable)
		STA PPUCTRL                    ; using onnametablescrolling variable to bitwise OR the mask %10010000

		JSR HandleInput
		
		LDA #$01
		CMP isjumping
		BNE notjumping
		LDX #$00
	jumploop:
		LDY jumpindex
		LDA SineTable, Y
		STA jumpamnt
		LDA SpriteData, X 
		CLC
		SBC jumpamnt
		STA $0200, X
		INX
		INX 
		INX
		INX
		CPX #$20
		BNE jumploop
		INC jumpindex
		LDA jumpindex
		CMP #$20
		BNE jumpnotfinished
		LDA #$00 
		STA isjumping
		STA jumpindex 
	jumpnotfinished:

	notjumping:
		LDA #$01
		CMP movement
		BNE :+
	    INC $0200 + 3           ; move mario metasprite right
	    INC $0200 + 7
	    INC $0200 + 11
	    INC $0200 + 15
	    INC $0200 + 19
	    INC $0200 + 23
	    INC $0200 + 27
	    INC $0200 + 31
	:
		LDA #$02
		CMP movement
		BNE :+
		DEC $0200 + 3         ; move mario metasprite left
	    DEC $0200 + 7
	    DEC $0200 + 11
	    DEC $0200 + 15
	    DEC $0200 + 19
	    DEC $0200 + 23
	    DEC $0200 + 27
	    DEC $0200 + 31
	:
 		JSR SetSpriteFrame
 	MovingLeft:
	    RTI
;================================================================================================
	LoadNextColumnToPPU:
		LDA onmapscreen
		CMP #$00
		BEQ firstscreen

		LDA columnctr
		CMP #$00
		BNE incctr
		LDA vramaddr
	    STA PPUADDR
	    LDA vramaddr + 1
	    STA PPUADDR
	    CLC
	    ADC #$01
	    BCC :+
	    INC vramaddr 
	:
	    STA vramaddr + 1
		LDX #$00
    	LDY #$00
	columncpyloop:
		; copy new column to nametable
		
		LDA (columnptr),Y
		STA PPUDATA
		INX 
		LDA columnptr 
		CLC
		ADC #$01
		BCC nocarry
		INC columnptr + 1
	nocarry:
		STA columnptr
		CPX #$1E
		BNE columncpyloop
	incctr:
		INC columnctr
		LDA columnctr
		CMP #$08
		BNE :+
		LDA #$00
		STA columnctr
	:

	firstscreen:

		RTS

;================================================================================================
; set animation frame for mario
	SetSpriteFrame:
		LDA isjumping
		CMP #$01
		BNE :+
		LDA #<frame3
		STA framepointer
		LDA #>frame3
		STA framepointer + 1
		JMP WriteFrameDataToOAM
	:

		LDA #$02
		CMP movement
		BNE movementnottwo   
		LDA #$00                     ; if movement variable is two thenset onframe to 0 here so
		STA onframe                  ; that it does not toggle in the AdvanceAnimation routine.
		                             ; result is mario stays on the same frame when left is held.
	movementnottwo:
		LDA #$01
		CMP movement
		BNE slowrun                  ; goto slow run if movement == 01
		JMP AdvanceAnimationFrame    ; else goto AdvanceAnimationFrame (advance frame every nmi)
	slowrun:
		LDA #$03                     ; progress animation frame every 3 nmi's
		CMP slowruncntr
		BNE :+
		LDA #$00                     ; when slowrunctr == 3 reset slowrun ctr and advance animation
		STA slowruncntr
		JMP AdvanceAnimationFrame
	:
		INC slowruncntr
		JMP WriteFrameDataToOAM
	AdvanceAnimationFrame:
		;set mario metasprite animation frame
	    LDA #$00
	    CMP onframe
	    BEQ :+
		STA onframe	 
		LDA #<frame1
		STA framepointer
		LDA #>frame1
		STA framepointer + 1

	    JMP WriteFrameDataToOAM
	:
	    LDA #$01
	    STA onframe
	    LDA #<frame2
	    STA framepointer
		LDA #>frame2
		STA framepointer + 1

	WriteFrameDataToOAM:
		LDY #$00
		LDX #$01
	loop:
		LDA (framepointer), Y
		STA $0200, X
		INX
		INX
		INX
		INX
		INY
		CPY #$08
		BNE loop
		RTS
;================================================================================================

	frame1: .byte $00, $01, $02, $03, $04, $05, $06, $07 ; tile number of each of marios 8 sprites - tile1 and 2 == running animation
	frame2: .byte $10, $11, $12, $13, $14, $15, $16, $17
	frame3: .byte $20, $21, $22, $23, $24, $25, $26, $27

	PaletteData:
		.byte $22,$29,$1A,$0F,$22,$36,$17,$0f,$22,$30,$21,$0f,$22,$27,$17,$0F  ;background palette data
		.byte $22,$16,$27,$18,$22,$1A,$30,$27,$22,$16,$30,$27,$22,$0F,$36,$17  ;sprite palette data
	SineTable:
		.incbin "sintable.bin"
	WorldData:
		.incbin "screen1.bin"
	WorldData2:
		.incbin "screen2.bin"
	WorldData3:
		.incbin "screen3_formatted.bin"
	WorldData4:
		.incbin "screen3_formatted.bin"
	SpriteData:
		; FORMAT OF SPRITE DATA
	    ;     ypos
	    ;      |  tile number of sprite within pattern table 
	    ;      |    |   flip sprite and change palette by changing bits
		;      |    |    |   xpos
		;      |    |    |    |
		;byte  0    1    2    3

		.byte floorypos-$1E, $00, $00, $08
		.byte floorypos-$1E, $01, $00, $10
		.byte floorypos-$16, $02, $00, $08
		.byte floorypos-$16, $03, $00, $10
		.byte floorypos-$E, $04, $00, $08
		.byte floorypos-$E, $05, $00, $10
		.byte floorypos-$6, $06, $00, $08
		.byte floorypos-$6, $07, $00, $10

	HandleInput:
	LatchController:
  		LDA #$01
  		STA $4016
  		LDA #$00
  		STA $4016     ; tell both the controllers to latch buttons
  					  ; $4016 must be read in this order 
  	ReadA: 
	  LDA $4016                    ; player 1 - A
	  AND #%00000001               ; only look at bit 0
	  BEQ ReadADone                ; branch to ReadADone if button is NOT pressed (0)
	  LDA #$01                     ; add instructions here to do something when button IS pressed (1)
	  CMP isjumping
	  BEQ ReadADone
	  STA isjumping

	ReadADone:                     ; handling this button is done
	  
	ReadB: 
	  LDA $4016       
	  AND #%00000001  
	  BEQ ReadBDone   


	ReadBDone:        

	ReadSelect: 
	  LDA $4016       
	  AND #%00000001  
	  BEQ ReadSelectDone   

	ReadSelectDone:

	ReadStart: 
	  LDA $4016       
	  AND #%00000001  
	  BEQ ReadStartDone   

	ReadStartDone:

	ReadUp: 
	  LDA $4016       
	  AND #%00000001  
	  BEQ ReadUpDone  

	ReadUpDone:

	ReadDown: 
	  LDA $4016    
	  AND #%00000001  
	  BEQ ReadDownDone  

	ReadDownDone:

	ReadLeft: 
	  LDA $4016       
	  AND #%00000001 
	  BEQ LeftNotDown 
	  LDA #$02
	  STA movement
	  RTS
	LeftNotDown:
	  LDA #$00
	  STA movement
	LeftDown:

	ReadRight: 
	  LDA $4016       
	  AND #%00000001 
	  BEQ RightNotDown
	  LDA #$01
	  STA movement
	  JMP RightDown
	RightNotDown:
	  LDA #$00
	  STA movement
	RightDown:

	
	RTS

.segment "VECTORS"
    .word NMI
    .word Reset
.segment "CHARS"
    .incbin "hellomario.chr"