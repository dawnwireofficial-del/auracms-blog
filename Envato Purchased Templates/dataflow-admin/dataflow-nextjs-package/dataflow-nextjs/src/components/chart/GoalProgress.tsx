"use client";

import { useEffect, useRef, useState } from "react";

type GoalProgressProps = {
  percent?: number;
};

export default function GoalProgress({ percent = 50 }: GoalProgressProps) {
  const roundRef = useRef<HTMLDivElement | null>(null);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [isMore, setIsMore] = useState(false);

  useEffect(() => {
    const deg = percent * 3.6;
    let start = 0;

    const interval = window.setInterval(() => {
      start += 1;
      setDisplayPercent(start);

      if (start >= percent) {
        clearInterval(interval);
      }
    }, 20);

    const el = roundRef.current;
    if (el) {
      el.style.transform = `rotate(${deg + 180}deg)`;
    }

    const t1 = percent >= 51 ? window.setTimeout(() => {
      if (roundRef.current) {
        roundRef.current.style.transform = `rotate(360deg)`;
      }
    }, 100) : undefined;

    const t2 = percent >= 51 ? window.setTimeout(() => {
      setIsMore(true);
    }, 1000) : undefined;

    const t3 = percent >= 51 ? window.setTimeout(() => {
      if (roundRef.current) {
        roundRef.current.style.transform = `rotate(${deg + 180}deg)`;
      }
    }, 1000) : undefined;

    return () => {
      clearInterval(interval);
      if (t1 !== undefined) clearTimeout(t1);
      if (t2 !== undefined) clearTimeout(t2);
      if (t3 !== undefined) clearTimeout(t3);
    };
  }, [percent]);

  return (
    <div className="wg-goal">
      <div className="left">
        <h5 className="mb-14">Great! Your goal is almost complete</h5>

        <div className="text mb-14">
          You have completed{" "}
          <span className="body-title opacity-8">{percent}%</span> <br />
          of your target.
        </div>

        <a href="#" className="d-flex gap6 items-center">
          <span className="body-title">View detail</span>
          <i className="icon-arrow-right fs14"></i>
        </a>
      </div>

      <div className="right">
        <div id="line-chart-28">
          <div
            className={`circle_percent ${isMore ? "percent_more" : ""}`}
            data-percent={percent}
          >
            <div className="circle_inner">
              <div className="round_per" ref={roundRef}></div>
            </div>

            {/* percent text */}
            <div className="circle_inbox">
              <span className="percent_text">{displayPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}