// AI 튜터 위젯 — 페이지에 <div id="tutor"></div> 와 window.TUTOR_TOPIC 가 있으면 동작한다.
(function () {
  const mount = document.getElementById("tutor");
  if (!mount) return;
  const topic = window.TUTOR_TOPIC || "general";

  mount.innerHTML = `
    <div class="tutor-box">
      <p class="tutor-title">🤖 AI 선생님에게 질문하기</p>
      <p class="hint">이 주제에 대해 궁금한 점을 물어보세요. (예: "왜 빗변이 가장 길어요?")</p>
      <textarea id="tutor-q" rows="3" placeholder="여기에 질문을 입력하세요…"></textarea>
      <div class="tutor-actions">
        <button id="tutor-ask">질문하기</button>
        <span id="tutor-status" class="hint"></span>
      </div>
      <div id="tutor-answer" class="tutor-answer" hidden></div>
    </div>
  `;

  const q = mount.querySelector("#tutor-q");
  const btn = mount.querySelector("#tutor-ask");
  const status = mount.querySelector("#tutor-status");
  const answer = mount.querySelector("#tutor-answer");

  async function ask() {
    const question = q.value.trim();
    if (!question) {
      status.textContent = "질문을 입력해 주세요.";
      return;
    }
    btn.disabled = true;
    status.textContent = "선생님이 생각하는 중… 🤔";
    answer.hidden = true;

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "오류가 발생했어요.");
      answer.textContent = data.answer;
      answer.hidden = false;
      status.textContent = "";
    } catch (err) {
      status.textContent = err.message || "답변을 가져오지 못했어요.";
    } finally {
      btn.disabled = false;
    }
  }

  btn.addEventListener("click", ask);
  q.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") ask();
  });
})();
