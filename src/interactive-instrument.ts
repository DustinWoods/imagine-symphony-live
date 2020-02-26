import { Graphics, Point, Text } from "pixi.js";
import { drawFilledArc } from "./draw-util";
import { Interactive } from "./interactive";
import { TEXT_STYLE_INTERACTIVE_NUM } from "./styles";

export enum InstrumentState {
  IDLE,
  COUNT_IN,
  HIT,
}

export class InteractiveInstrument extends Interactive {
  private bkgGraphics: Graphics = new Graphics();
  private dynamicGraphics: Graphics = new Graphics();
  private dynamicText: Text = new Text("", TEXT_STYLE_INTERACTIVE_NUM);
  private maskGraphics: Graphics = new Graphics();
  private centerPoint: Point = new Point();
  private initialStartRad: number;
  private initialEndRad: number;
  private rTemp = 0;
  public state: InstrumentState = InstrumentState.IDLE;
  public stateValue: number = 0;

  constructor(public color: number, public startArc: number, public endArc: number, public startRad: number, public endRad: number) {
    super();
    this.initialStartRad = startRad;
    this.initialEndRad = endRad;

    this.updateSize({
      startRad,
      endRad,
      startArc,
      endArc,
    });

    this.mask = this.maskGraphics;
    this.addChild(this.bkgGraphics);
    this.addChild(this.maskGraphics);
    this.addChild(this.dynamicGraphics);
    this.addChild(this.dynamicText);
    this.dynamicText.anchor.set(0.5,0.5);
    this.dynamicText.position.set(this.centerPoint.x, this.centerPoint.y);
  }

  multiplierResize(multiplier: number) {
    this.updateSize({
      startRad: this.initialStartRad*multiplier,
      endRad: this.initialEndRad*multiplier,
    });
  }

  updateSize(options: {
    startRad?: number,
    endRad?: number,
    startArc?: number,
    endArc?: number
  }) {
    if(options.startRad) this.startRad = options.startRad;
    if(options.endRad) this.endRad = options.endRad;
    if(options.startArc) this.startArc = options.startArc;
    if(options.endArc) this.endArc = options.endArc;
    const centerArc = this.startArc + (this.endArc - this.startArc) / 2;
    const centerRad = this.startRad + (this.endRad - this.startRad) / 2;
    this.centerPoint.set(Math.cos(centerArc) * centerRad, -Math.sin(centerArc) * centerRad);
    this.dynamicText.position.set(this.centerPoint.x, this.centerPoint.y);
    this.updateMask();
    this.draw();
    this.drawDynamics();
  }

  onDrop(e: PIXI.interaction.InteractionEvent) {
    const pos = this.getGlobalPosition();
    const distance = Math.sqrt(Math.pow(pos.x - e.data.global.x + this.centerPoint.x, 2) + Math.pow(pos.y - e.data.global.y + this.centerPoint.y, 2));
    if(distance > 64) {
      return;
    }
    this.rTemp = 1;
  }

  setState(newState: InstrumentState, value: number = 0) {
    this.state = newState;
    this.stateValue = value;

    if(this.state === InstrumentState.IDLE) {
      this.dynamicText.text = "";
    }
    if(this.state === InstrumentState.HIT) {
      this.dynamicText.text = "";
    }
  }

  onTick(currentBeat: number) {
    if(this.rTemp > 0) {
      this.rTemp -= 0.05;
    } else {
      this.rTemp = 0;
    }
    if(this.state === InstrumentState.COUNT_IN) {
      this.dynamicText.text = `${Math.ceil(this.stateValue - currentBeat)}`;
    }
    this.drawDynamics();
  }

  updateMask() {
    this.maskGraphics
      .clear()
      // @TODO - why doesn't this mask as expected?
      .lineStyle(10, 0x000000, 1, 0)
      .beginFill(0xffffff, 1);

    drawFilledArc(this.maskGraphics, this.startArc, this.endArc, this.startRad, this.endRad, 100);

    this.maskGraphics.endFill();

  }

  drawDynamics() {
    this.dynamicGraphics.clear();

    if(this.state === InstrumentState.IDLE) {
      this.dynamicGraphics.lineStyle(2, 0xffffff, 0.1, 0);
    } else {
      this.dynamicGraphics.lineStyle(4, 0xffffff, 0.5, 0);
    }

    this.dynamicGraphics.drawCircle(this.centerPoint.x, this.centerPoint.y, 48 );

    if(this.state === InstrumentState.HIT) {
      this.dynamicGraphics
        .lineStyle(0)
        .beginFill(0xffffff, 0.1)
        .drawCircle(this.centerPoint.x, this.centerPoint.y, 42 )
        .endFill();
    }

    if(this.rTemp > 0) {
      this.dynamicGraphics
        .lineStyle(4, 0xffffff, this.rTemp*0.5)
        .drawCircle(this.centerPoint.x, this.centerPoint.y, 48 + (1 - this.rTemp) * 32 )
        .lineStyle(1, 0xffffff, this.rTemp)
        .drawCircle(this.centerPoint.x, this.centerPoint.y, 48 + (1 - this.rTemp) * 64 );
      this.dynamicGraphics.beginFill(0xffffff, 0.5 * this.rTemp)
        .lineStyle(0)
        .drawCircle(this.centerPoint.x, this.centerPoint.y, 32)
        .endFill();
    }

  }

  draw() {

    this.bkgGraphics
      .clear()
      //.lineStyle(10, 0x55aacc, 1, 0)
      .beginFill(this.color, 0.5);

    drawFilledArc(this.bkgGraphics, this.startArc, this.endArc, this.startRad, this.endRad, 100);

    this.bkgGraphics.endFill();

  }
}