import { Application, Container } from "pixi.js";
import State from "./state";
import IntroFilmState from "./intro-film-state";
import { StateEvents } from "./types/state-events";
import OverWorldState from "./overworld-state";
import SoundVisualState from './sound-visual-state';

type StateNames = "intro" | "overworld" | "soundvisual";

export class StateMachine {
  protected states: Array<{name: string, state: State}> = new Array();
  protected currentStateName: string;
  protected currentState: State;
  protected currentStateContainer: Container;
  private resizePollInterval = 500;
  private previousWindowDimensions: {width: number, height: number} = {width: window.innerWidth, height: window.innerHeight};
  private windowDimensions: {width: number, height: number} = {width: window.innerWidth, height: window.innerHeight};

  constructor(public app: Application) {

    setInterval(this.checkResizeEvent.bind(this), this.resizePollInterval);

    window.addEventListener("resize", () => {
      this.windowDimensions.width = window.innerWidth;
      this.windowDimensions.height = window.innerHeight;
    });

    this.addState("intro", new IntroFilmState());
    this.addState("overworld", new OverWorldState());
    this.addState("soundvisual", new SoundVisualState());

    this.addStateCondition("intro", "complete", "overworld");

    this.setState("soundvisual");
  }

  checkResizeEvent() {
    if(this.windowDimensions.height !== this.previousWindowDimensions.height || this.windowDimensions.width !== this.previousWindowDimensions.width) {
      this.previousWindowDimensions.height = this.windowDimensions.height;
      this.previousWindowDimensions.width = this.windowDimensions.width;
      if(this.currentState) {
        this.currentState.onResize(this.windowDimensions);
      }
    }
  }

  addState(name: StateNames, state: State) {
    this.states.push({name, state});
  }

  addStateCondition(triggerState: StateNames, stateEvent: StateEvents, induceState: StateNames) {
    const stateF = this.states.find(({name}) => name == triggerState);
    if(!stateF) {
      throw new Error(`State ${triggerState} unknown`);
    }

    stateF.state.on(stateEvent, this.setState.bind(this, induceState));
  }

  async setState(findName: StateNames) {
    const stateF = this.states.find(({name}) => name == findName);
    if(!stateF) {
      throw new Error(`State ${findName} unknown`);
    }
    const newContainer = await stateF.state.createContainer(this.app);
    stateF.state.onResize(this.windowDimensions);
    if(this.currentState) {
      await this.currentState.cleanUp();
    }
    if(this.currentStateContainer) {
      console.log("removing...");
      this.app.stage.removeChild(this.currentStateContainer);
      this.currentStateContainer.destroy();
    }
    this.app.stage.addChild(newContainer);
    this.currentStateContainer = newContainer;
    this.currentStateName = findName;
    this.currentState = stateF.state;
  }

}