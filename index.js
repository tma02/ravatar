// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316
function xmur3(str) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
    h = h << 13 | h >>> 19;
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
}

function sfc32(a, b, c, d) {
  return function() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0; 
    var t = (a + b) | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    d = d + 1 | 0;
    t = t + d | 0;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  }
}

const ROW_TYPE = {
  LINE: {
    type: 'LINE',
    nodes: 1,
    hasBg: false
  },
  LINE_DOT: {
    type: 'LINE_DOT',
    nodes: 2,
    hasBg: true
  },
  DOT_LINE: {
    type: 'DOT_LINE',
    nodes: 2,
    hasBg: true
  },
  DOT_DOT_DOT: {
    type: 'DOT_DOT_DOT',
    nodes: 3,
    hasBg: true
  },
  DOT_SPACE_DOT: {
    type: 'DOT_SPACE_DOT',
    nodes: 2,
    hasBg: true
  },
  DOT_DOT_SPACE: {
    type: 'DOT_DOT_SPACE',
    nodes: 2,
    hasBg: true
  },
  SPACE_DOT_DOT: {
    type: 'SPACE_DOT_DOT',
    nodes: 2,
    hasBg: true
  },
  SPACE_LINE: {
    type: 'SPACE_LINE',
    nodes: 1,
    hasBg: false
  },
  LINE_SPACE: {
    type: 'LINE_SPACE',
    nodes: 1,
    hasBg: false
  }
};

const GRADIENT_SETS = [
  // light blue
  {
    low: '#716bda',
    high: '#69e6ff',
    bgLow: '#1a1832',
    bgHigh: '#152742'
  },
  // light green
  {
    low: '#65bb61',
    high: '#b8fab6',
    bgLow: '#1d221d',
    bgHigh: '#092808'
  },
  // gold
  {
    low: '#bbae61',
    high: '#faf7b6',
    bgLow: '#252213',
    bgHigh: '#3c3a2a'
  },
  // red
  {
    low: '#862525',
    high: '#e94f4f',
    bgLow: '#331010',
    bgHigh: '#382d2d'
  },
  // purple
  {
    low: '#7253a1',
    high: '#9989b8',
    bgLow: '#1f172a',
    bgHigh: '#332d40'
  },
  // lime
  {
    low: '#b6cd3c',
    high: '#f0fac6',
    bgLow: '#1e210c',
    bgHigh: '#373c27'
  }
];

let Ravatar = { };

Ravatar.generate = function(seedStr) {
  // Seed and make a PRNGing function
  let seedFunc = xmur3(seedStr);
  let randFunc = sfc32(seedFunc(), seedFunc(), seedFunc(), seedFunc());
  
  // Generate properties of the avatar
  let avatarProps = { };
  avatarProps.isVertical = randFunc() >= 0.5; // 50/50
  avatarProps.rows = [];
  for (var i = 0; i < 3; i++) {
    avatarProps.rows[i] = ROW_TYPE[Object.keys(ROW_TYPE)[~~(randFunc() * Object.keys(ROW_TYPE).length)]];
  }
  avatarProps.gradientSet = GRADIENT_SETS[~~(randFunc() * GRADIENT_SETS.length)];
  let totalNodes = avatarProps.rows.reduce((a, c) => ({ nodes: a.nodes + c.nodes })).nodes;
  avatarProps.coloredNodes = [];
  let coloredCount = 0;
  for (var i = 0; i < totalNodes; i++) {
    avatarProps.coloredNodes[i] = randFunc() >= 0.65; // 35% for each node to be colored
    if (avatarProps.coloredNodes[i]) {
      coloredCount += 1;
    }
  }
  // Make sure at least one node is colored
  if (coloredCount == 0) {
    avatarProps.coloredNodes[~~(randFunc() * avatarProps.coloredNodes.length)] = true;
  }

  return avatarProps;
};

Ravatar.render = function(canvasElement, avatarProps) {
  // https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas/7838871#7838871
  function roundRect(context, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    context.beginPath();
    context.moveTo(x+r, y);
    context.arcTo(x+w, y,   x+w, y+h, r);
    context.arcTo(x+w, y+h, x,   y+h, r);
    context.arcTo(x,   y+h, x,   y,   r);
    context.arcTo(x,   y,   x+w, y,   r);
    context.closePath();
    return context;
  }

  canvasElement.width = 512;
  canvasElement.height = 512;
  let context = canvasElement.getContext('2d');
  
  // Render the background gradient
  let backgroundGradient = context.createLinearGradient(0, canvasElement.width, canvasElement.width, 0);
  backgroundGradient.addColorStop(0, 'rgb(0, 0, 0)');
  backgroundGradient.addColorStop(1, 'rgb(42, 42, 42)');
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, canvasElement.width, canvasElement.width);
  
  if (avatarProps.isVertical) {
    context.setTransform(0, -1, 1, 0, 0, 512);
  }

  const padding = canvasElement.width / 6;
  let length = 4 * (canvasElement.width / 6);
  const margin = (3 / 2) * (length / 3 / 4);
  let width = length / 4;
  const halfLineLength = length * (2/3) - ((1/2) * (length / 3 / 4));

  let darkLayerGradient = context.createLinearGradient(0, 0, length, 0);
  darkLayerGradient.addColorStop(0, avatarProps.gradientSet.bgLow);
  darkLayerGradient.addColorStop(1, avatarProps.gradientSet.bgHigh);

  let lightLayerGradient = context.createLinearGradient(0, 0, length, 0);
  lightLayerGradient.addColorStop(0, avatarProps.gradientSet.low);
  lightLayerGradient.addColorStop(1, avatarProps.gradientSet.high);

  let currentNode = 0;

  // Render the actual avatar
  for (var i = 0; i < 3; i++) {
    let startX = padding;
    let startY = padding + ((width + margin) * i);
    // draw the background first
    switch (avatarProps.rows[i].type) {
      case 'LINE':
        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();
        break;
      case 'LINE_DOT':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();

        startX += halfLineLength + margin;

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'DOT_LINE':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();
        break;
      case 'DOT_DOT_DOT':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'DOT_SPACE_DOT':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, length, width, width / 2);
        context.fill();

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += 2 * (width + margin);

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'DOT_DOT_SPACE':
        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'SPACE_DOT_DOT':
        startX += width + margin;

        context.fillStyle = darkLayerGradient;
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();

        startX += width + margin;

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, width, width, width / 2);
        context.fill();
        break;
      case 'SPACE_LINE':
        startX += width + margin;

        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();
        break;
      case 'LINE_SPACE':
        context.fillStyle = '#f0f0f0';
        if (avatarProps.coloredNodes[currentNode++]) {
          context.fillStyle = lightLayerGradient;
        }
        roundRect(context, startX, startY, halfLineLength, width, width / 2);
        context.fill();
        break;
    }
  }
};