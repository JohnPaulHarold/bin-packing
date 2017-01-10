/******************************************************************************

This is a binary tree based bin packing algorithm that is more complex than
the simple Packer (packer.js). Instead of starting off with a fixed width and
height, it starts with the width and height of the first block passed and then
grows as necessary to accomodate each subsequent block. As it grows it attempts
to maintain a roughly square ratio by making 'smart' choices about whether to
grow right or down.

When growing, the algorithm can only grow to the right OR down. Therefore, if
the new block is BOTH wider and taller than the current target then it will be
rejected. This makes it very important to initialize with a sensible starting
width and height. If you are providing sorted input (largest first) then this
will not be an issue.

A potential way to solve this limitation would be to allow growth in BOTH
directions at once, but this requires maintaining a more complex tree
with 3 children (down, right and center) and that complexity can be avoided
by simply chosing a sensible starting block.

Best results occur when the input blocks are sorted by height, or even better
when sorted by max(width,height).

Inputs:
------

  blocks: array of any objects that have .w and .h attributes

Outputs:
-------

  marks each block that fits with a .fit attribute pointing to a
  node with .x and .y coordinates

Example:
-------

  var blocks = [
    { w: 100, h: 100 },
    { w: 100, h: 100 },
    { w:  80, h:  80 },
    { w:  80, h:  80 },
    etc
    etc
  ];

  var packer = new GrowingPacker();
  packer.fit(blocks);

  for(var n = 0 ; n < blocks.length ; n++) {
    var block = blocks[n];
    if (block.fit) {
      Draw(block.fit.x, block.fit.y, block.w, block.h);
    }
  }


******************************************************************************/

var GrowingPacker = function () { 
  // we might only want to grow in a specific direction, 
  // as opposed to getting larger and larger as a square
  // 
  // 
  // we might also want to limit how far back nodes will be filled. 
  // Assuming we want to show the passing of time, we would 
  // limit how far back nodes should be filled.
  // 
  // 
  
  
  var growthDirection;
  // for the particular constrained direction, we set a max height.
  var maxConstrainedSize;

  var container;

  var packElemGap;

  var self = this;


  self.init = function (_growthDirection, _maxConstrainedSize, _containerElement, _packElemGap) {
    growthDirection = _growthDirection;
    // for the particular constrained direction, we set a max height.
    maxConstrainedSize = _maxConstrainedSize;

    container = _containerElement ? document.querySelector(_containerElement) : undefined;

    packElemGap = (_packElemGap || _packElemGap === 0 ) ? _packElemGap : 10;
  };


  self.addPaddingToBlocks = function (blocks) {
    for (var i = 0; i<blocks.length; i+=1) {
      var block = blocks[i];

      block.w += ((packElemGap || packElemGap === 0) ? packElemGap * 2 : 10);
      block.h += ((packElemGap || packElemGap === 0) ? packElemGap * 2 : 10);
    }

    return blocks;
  };


  self.fit = function (blocks) {
    var n, node, block, len = blocks.length;

    var w, h;

    // add some padding before we start any fitting

    blocks = self.addPaddingToBlocks(blocks);
    
    if (growthDirection === 'right') {
      w = len > 0 ? blocks[0].w : 0;
      h = len > 0 ? maxConstrainedSize : 0;
    } else {
      w = len > 0 ? maxConstrainedSize : 0;
      h = len > 0 ? blocks[0].h : 0;
    }

    // we set the initial root node?
    // x, y = starting position
    // w, h = starting size.
    self.root = { x: 0, y: 0, w: w, h: h };
    for (n = 0; n < len ; n++) {
      block = blocks[n];
      node = self.findNode(self.root, block.w, block.h);
      
      if (node) {
        block.fit = self.splitNode(node, block.w, block.h);
      } else {
        // if we couldn't find a node to fit into, we need to grow the rootNode
        // pass in the block that couldn't fit
        block.fit = self.growNode(block.w, block.h);
      }
    }
  };

  self.findNode = function (root, blockWidth, blockHeight) {
    if (root.used)
      // if we've already used this root node, find another
      // recursively call this method
      return self.findNode(root.right, blockWidth, blockHeight) || self.findNode(root.down, blockWidth, blockHeight);
    else if ((blockWidth <= root.w) && (blockHeight  <= root.h))
      return root;
    else
      return null;
  };

  self.splitNode = function (node, w, h) {
    node.used = true;

    /* 
    OK, here we split the remaining area after we've placed a node
    it seems to split it into a down node, and a right node
    
    For the down node, we set the positon as the starting X and the bottom edge of the source node

    For the right node, we set the position as the right edge of the source node, and the starting top y pos

    */
    node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
    node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
    return node;
  };

  self.growNode = function (w, h) {

    // depending on our constraints, we shouldn't grow in the opposite direction

    var canGrowDown  = (w <= self.root.w);
    var canGrowRight = (h <= self.root.h);

    var shouldGrowRight,
        shouldGrowDown;

    if (growthDirection === "right") {
      // grow horizontally only

      shouldGrowRight = canGrowRight && (self.root.h >= (self.root.w + w)); // attempt to keep square-ish by growing right when height is much greater than width
      shouldGrowDown  = false;

    } else {
      // grow vertically only

      shouldGrowRight = false;
      shouldGrowDown  = canGrowDown  && (self.root.w >= (self.root.h + h)); // attempt to keep square-ish by growing down  when width  is much greater than height

    }

    

    if (shouldGrowRight)
      return self.growRight(w, h);
    else if (shouldGrowDown)
      return self.growDown(w, h);
    else if (canGrowRight)
     return self.growRight(w, h);
    else if (canGrowDown)
      return self.growDown(w, h);
    else
      return null; // need to ensure sensible root starting size to avoid this happening
  };

  self.growRight = function (w, h) {
    self.root = {
      used: true,
      x: 0,
      y: 0,
      w: self.root.w + w,
      h: self.root.h,
      down: self.root,
      right: { 
        x: self.root.w, 
        y: 0, 
        w: w, 
        h: self.root.h 
      }
    };

    if (container) {
        container.style.width = self.root.w + w + "px";
    }
    
    var foundNode = self.findNode(self.root, w, h);

    if (foundNode)
      return self.splitNode(foundNode, w, h);
    else
      return null;
  };

  self.growDown = function (w, h) {
    self.root = {
      used: true,
      x: 0,
      y: 0,
      w: self.root.w,
      h: self.root.h + h,
      down:  { x: 0, y: self.root.h, w: self.root.w, h: h },
      right: self.root
    };

    var foundNode = self.findNode(self.root, w, h);
    
    if (foundNode)
      return self.splitNode(foundNode, w, h);
    else
      return null;
  };
};

module.exports = new GrowingPacker();

