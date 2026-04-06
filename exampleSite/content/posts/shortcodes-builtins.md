---
title: Built-In Shortcodes Post
date: 2026-04-05
summary: A fixture covering supported built-in Hugo shortcodes.
tags: [shortcodes, hugo, testing, fixture]
featuredImage: /images/post-1.jpg
---

## Overview

This post exists to exercise built-in shortcode rendering in the theme.

{{< highlight go >}}
func main() {
  println("hello from shortcode fixture")
}
{{< /highlight >}}

## YouTube

{{< youtube 0RKpf3rK57I >}}

## X Or Twitter

{{< x user="jack" id="20" >}}

## Instagram

{{< instagram CxOWiQNP2MO >}}

## Mermaid

```mermaid
graph TD
  A[Write] --> B[Render]
  B --> C[Verify]
```

## Message

Inline notice rendered through a Hugo shortcode example.

## More Content

This section keeps the post from being only shortcode blocks.
