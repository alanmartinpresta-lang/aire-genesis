#!/usr/bin/env python3
"""AIRE Genesis — autonomous learning benchmark."""
from __future__ import annotations
import argparse, json
from pathlib import Path
from aire.alpha_world import create_alpha_world

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--steps", type=int, default=20001)
    ap.add_argument("--seed", type=int, default=20260815)
    ap.add_argument("--dt", type=float, default=1.0)
    ap.add_argument("--checkpoint", default="ALPHA_GENESIS.aire")
    ap.add_argument("--log", default="ALPHA_LEARNING_BENCHMARK.jsonl")
    args = ap.parse_args()

    world = create_alpha_world(seed=args.seed, dt=args.dt)
    log_path = Path(args.log)

    completed = 0
    with log_path.open("w", encoding="utf-8") as f:
        for step in range(args.steps):
            if not world.organism.alive:
                break
            rep = world.step(compute_digest=False)
            a = world.autonomy
            f.write(json.dumps({
                "step": step + 1,
                "time": world.time,
                "alive": world.organism.alive,
                "action": rep.action,
                "reward": rep.reward,
                "cumulative_reward": a.cumulative_reward,
                "epsilon": a.epsilon,
                "q_states": len(a.q_values),
                "memory": len(a.memory),
                "autobiography": len(a.autobiography)
            }, ensure_ascii=False) + "\n")
            completed = step + 1

    world.save_checkpoint(Path(args.checkpoint))
    print(json.dumps({
        "steps_completed": completed,
        "alive": world.organism.alive,
        "time": world.time,
        "q_states": len(world.autonomy.q_values),
        "memory": len(world.autonomy.memory),
        "autobiography": len(world.autonomy.autobiography),
        "log": args.log,
        "checkpoint": args.checkpoint
    }, indent=2))

if __name__ == "__main__":
    main()
