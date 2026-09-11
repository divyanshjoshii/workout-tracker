# Overview

## What this is

A mobile-first progressive web app for logging gym sessions. It handles splits,
templates, supersets, dropsets, rest timers, body weight and per-exercise
strength progression.

The README covers setup and the directory layout. This file covers the why.

## A normal session

```mermaid
%%{init: {"theme": "base", "themeVariables": {"background": "#0B0F14", "primaryColor": "#151A21", "primaryTextColor": "#F8FAFC", "primaryBorderColor": "#22C55E", "lineColor": "#22C55E", "textColor": "#F8FAFC", "edgeLabelBackground": "#0B0F14"}}}%%
flowchart LR
    open(["Open the app"]) --> dash["Dashboard suggests<br/>the next split day"]
    dash --> start["Start from its<br/>linked template"]
    start --> log["Log sets<br/>supersets, dropsets,<br/>rest timer"]
    log --> finish["Finish"]
    finish --> prog["Progress charts and<br/>hall of fame pick up<br/>the new sets"]

    classDef entry fill:#0E1E2C,stroke:#38BDF8,color:#F8FAFC
    classDef step fill:#151A21,stroke:#22C55E,color:#F8FAFC
    classDef payoff fill:#2A2410,stroke:#EAB308,color:#F8FAFC
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
