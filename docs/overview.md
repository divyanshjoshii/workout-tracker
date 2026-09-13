# Overview

## What this is

A mobile-first progressive web app for logging gym sessions. It handles splits,
templates, supersets, dropsets, rest timers, body weight and per-exercise
strength progression.

The README covers setup and the directory layout. This file covers the why.

## A normal session

```mermaid
%%{init: {"theme":"base","themeVariables":{"background":"#FFFFFF","primaryColor":"#FFFFFF","primaryTextColor":"#43222F","primaryBorderColor":"#FF9EC4","lineColor":"#FF9EC4","secondaryColor":"#FFF3F8","tertiaryColor":"#FFFFFF","textColor":"#43222F","edgeLabelBackground":"#FFFFFF","clusterBkg":"#FFFFFF","clusterBorder":"#D9D3D5","titleColor":"#43222F","rowOdd":"#FFFFFF","rowEven":"#F4F2F3","attributeBackgroundColorOdd":"#FFFFFF","attributeBackgroundColorEven":"#F4F2F3","actorBkg":"#FFFFFF","actorBorder":"#FF9EC4","actorTextColor":"#43222F","actorLineColor":"#AA9CA1","signalColor":"#FF9EC4","signalTextColor":"#43222F","labelBoxBkgColor":"#FFFFFF","labelBoxBorderColor":"#FF9EC4","labelTextColor":"#43222F","loopTextColor":"#43222F","noteBkgColor":"#FFF0F6","noteTextColor":"#43222F","noteBorderColor":"#FF9EC4","activationBkgColor":"#FF9EC4","activationBorderColor":"#FF9EC4"}}}%%
%% palette 24b50cd8
flowchart LR
    open(["Open the app"]) --> dash["Dashboard suggests<br/>the next split day"]
    dash --> start["Start from its<br/>linked template"]
    start --> log["Log sets<br/>supersets, dropsets,<br/>rest timer"]
    log --> finish["Finish"]
    finish --> prog["Progress charts and<br/>hall of fame pick up<br/>the new sets"]

    classDef entry fill:#E5EFF8,stroke:#5B9BD5,color:#43222F
    classDef step fill:#FFEFF6,stroke:#FF9EC4,color:#43222F
    classDef payoff fill:#FAF1DE,stroke:#E0A92E,color:#43222F
    class open entry
    class dash,start,log,finish step
    class prog payoff
```

## Who it is for

One person, for now. There is no team and no plan for other users yet, so
anything built for a hypothetical second user is speculative until that changes.

## Done looks like

The app takes around 20 seconds to load. The current milestone is a fast first
paint on a phone, and no new feature ships before that lands.

## Explicitly out of scope

- New features until the load time is fixed
- Multi-user or social features
- Anything that assumes a persistent filesystem, since Vercel does not provide one
