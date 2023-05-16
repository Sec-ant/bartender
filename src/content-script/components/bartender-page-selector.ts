import "@webcomponents/custom-elements";
import "lit/polyfill-support.js";

import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

type Position = [number, number, number, number];

export type SelectEvent = CustomEvent<{ position: Position }>;

@customElement("bartender-page-selector")
export default class BartenderPageSelector extends LitElement {
  static styles = css`
    :host(.hidden) {
      display: none;
    }
    .wrapper {
      position: fixed;
      z-index: 99999;
      top: 0;
      left: 0;
      mix-blend-mode: multiply;
    }
    .overlay {
      position: absolute;
      width: 100vw;
      height: 100vh;
      background-color: rgb(50%, 50%, 50%);
      user-select: none;
    }
    .select-zone {
      position: absolute;
      background-color: #ffffff;
      pointer-events: none;
    }
  `;

  @state()
  private _position: Position | null = null;

  render() {
    return html`
      <div class="wrapper">
        <div
          class="overlay"
          @mousedown=${this._handleMouseDown}
          @mousemove=${this._handleMouseMove}
          @mouseup=${this._handleMouseUp}
        ></div>
        <div
          class="select-zone"
          style=${styleMap(this._mapPositionToStyle(this._position))}
        ></div>
      </div>
    `;
  }

  private _handleMouseDown({ clientX, clientY }: MouseEvent) {
    this._position = [clientX, clientY, clientX, clientY];
  }

  private _handleMouseMove({ clientX, clientY }: MouseEvent) {
    if (!this._position) {
      return;
    }
    this._position = [this._position[0], this._position[1], clientX, clientY];
  }

  private _handleMouseUp() {
    if (!this._position) {
      return;
    }
    this.dispatchEvent(
      new CustomEvent("selected", {
        detail: {
          position: this._position,
        },
      }) as SelectEvent
    );
    this._position = null;
  }

  private _mapPositionToStyle(position: typeof this._position) {
    if (!position) {
      return {};
    }
    const [startX, startY, stopX, stopY] = position;
    const left = Math.min(startX, stopX);
    const top = Math.min(startY, stopY);
    const width = Math.abs(stopX - startX);
    const height = Math.abs(stopY - startY);
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "bartender-page-selector": BartenderPageSelector;
  }
  interface HTMLElementEventMap {
    selected: SelectEvent;
  }
}
