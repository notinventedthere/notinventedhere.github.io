
# Table of Contents

1.  [Description](#orgd0ddf68)
2.  [Notes](#org5f26e2e)
3.  [TODOs](#orgaacea54)
    1.  [Read about vector fields](#org89d4ad6)
    2.  [Read about manipulating vectors in paperjs](#orgd1ce9e5)
    3.  [Find out how to draw arrows in paperjs](#org0a307ee)

[Live Site](https://notinventedthere.github.io/vector-fun/)


<a id="orgd0ddf68"></a>

# Description

A small experiment with [vector fields](https://en.wikipedia.org/wiki/Vector_field) in [paper.js.](http://paperjs.org/)

I started by reading and watching material on linear algebra and vector fields.
Then I wrote a renderer for the vectors, choosing evenly spaced points and
drawing the vector at that point with an arrow. I then moved on to writing a
particle simulator which treats the vectors as velocities. Overlaying these
systems gives some pleasing visuals.

The final set of examples features such things as cursor tracking,
calculating the angle of vectors such that they form curves in the space,
color changes, sine functions, and particle respawning.

The bulk of the project took one week to complete as a javascript novice.


<a id="org5f26e2e"></a>

# Notes

-   vectors must be on the left side of a multiplication due to js typing quirks
-   when the error 'this.<sub>x</sub> is not a function' is raised, make sure all constructors
    have a \`new\` keyword


<a id="orgaacea54"></a>

# TODOs


<a id="org89d4ad6"></a>

## DONE Read about vector fields


<a id="orgd1ce9e5"></a>

## DONE Read about manipulating vectors in paperjs


<a id="org0a307ee"></a>

## DONE Find out how to draw arrows in paperjs

use paths (i.e. it's manual)
CLOSED: <span class="timestamp-wrapper"><span class="timestamp">[2019-05-27 Mon 18:29]</span></span>

