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

## Structured Content

{{< details summary="Open the embedded details block" open=true >}}
This copy stays visible because the details shortcode starts expanded.
{{< /details >}}

{{< figure
  src="/images/post-1.jpg"
  alt="Fixture cover image"
  caption="Fixture image rendered by the figure shortcode."
>}}

## Parameters And Links

The site description comes from the param shortcode: {{% param "description" %}}.

[First Post via ref shortcode]({{% ref "/posts/first-post" %}})

[Second Post via relref shortcode]({{% relref "/posts/second-post" %}})

{{< qr text="https://example.org/posts/shortcodes-builtins/" alt="QR code for the shortcode fixture post" />}}

## YouTube

{{< youtube id=0RKpf3rK57I title="Fixture YouTube video" >}}

## Vimeo

{{< vimeo id=19899678 title="Fixture Vimeo video" >}}

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
