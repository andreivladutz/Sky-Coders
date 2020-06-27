import { Spinner } from "spin.js";

var opts = {
  lines: 10, // The number of lines to draw
  length: 47, // The length of each line
  width: 17, // The line thickness
  radius: 40, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 0.6, // Corner roundness (0..1)
  color: "#18c1d6", // CSS color or array of colors
  fadeColor: "transparent", // CSS color or array of colors
  speed: 0.7, // Rounds per second
  rotate: 0, // The rotation offset
  animation: "spinner-line-fade-quick", // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: "spinner", // The CSS class to assign to the spinner
  top: "49%", // Top position relative to parent
  left: "50%", // Left position relative to parent
  shadow: "0 0 1px transparent", // Box-shadow for the lines
  position: "absolute" // Element positioning
};

export default function createSpinner(
  top: number,
  left: number,
  scale: number = 1,
  position: string = "relative"
) {
  opts.scale = scale;
  opts.top = top + "%";
  opts.left = left + "%";

  let spinner = new Spinner(opts).spin();
  spinner.el.style.position = position;

  return spinner;
}
