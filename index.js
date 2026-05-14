// enpoins:
//      https://cusatapiobj.kerala.gov.in/api/login,
//      https://cusatapiobj.kerala.gov.in/api/questionslist

const base_url = "https://cusatapiobj.kerala.gov.in/api";
const loaderContainer = document.querySelector(".loader-container");
const loaderText = document.getElementById("loaderText");
const resultsDiv = document.getElementById("results");

async function login(register_no) {
  console.log("Logging in...");
  loaderContainer.style.display = "block";
  loaderText.textContent = "Authenticating...";

  const url = base_url + "/login";
  const data = { register_no: register_no };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw Error("404 returned");
    const jsonResponse = await response.json();
    console.log("Logged in!");
    return jsonResponse;
  } catch (error) {
    console.error("Login failed:", error);
    resultsDiv.innerHTML = `<div class="error-msg">Invalid Register Number. Please check and try again (ensure it's not your Roll Number).</div>`;
    loaderContainer.style.display = "none";
    loaderText.textContent = "";

    throw error; // rethrow
  }
}

async function get_questionlist(auth_token, exam_id) {
  console.log("Getting question list...");
  loaderText.textContent = "Fetching exam data...";

  const url = base_url + "/questionslist";
  const headers = {
    Authorization: "Bearer " + auth_token,
    "Content-Type": "application/json",
  };
  const data = { examId: exam_id };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) throw Error("exam code invalid");
    const jsonResponse = await response.json();
    console.log("Got questions!");
    loaderContainer.style.display = "none";
    loaderText.textContent = "";

    return jsonResponse;
  } catch (error) {
    console.error("Failed to get questions:", error);
    loaderContainer.style.display = "none";
    loaderText.textContent = "";
    throw error; // rethrows
  }
}

async function main() {
  resultsDiv.innerHTML = "";
  try {
    const register_no = document.getElementById("register_no").value.trim();
    if (!register_no) {
      resultsDiv.innerHTML = `<div class="error-msg">Please enter a valid Register Number.</div>`;
      return;
    }

    const loginResponse = await login(register_no);
    const auth_token = loginResponse["access_token"];
    const exams = loginResponse["exams"];
    const candidate_name =
      loginResponse["candidates"]["vchrCandidateName"] || "Unknown Candidate";

    let allResults = `
      <div class="candidate-header">
        <span class="label">Candidate</span>
        <span class="value">${candidate_name}</span>
      </div>
    `;

    for (let i = 0; i < exams.length; i++) {
      const exam = exams[i];
      const exam_id = exam["intExamID"];
      const exam_name = exam["vchrExamName"] || `Exam ${i + 1}`;

      try {
        const questionlist = await get_questionlist(auth_token, exam_id);

        let score = 0;
        let total_qs = 0;
        let attempted_qs = 0;
        let correct_qs = 0;
        let incorrect_qs = 0;
        let cancelled_qs = 0;

        for (const question of questionlist["questions"]) {
          const correct_answer = question["correctAnswer"];
          const selected_answer = question["selectedAnswer"];
          const cancellation_status = question["intCancellationStatus"];

          if (
            cancellation_status === 1 ||
            typeof correct_answer !== "string" ||
            !/^\d+$/.test(correct_answer.trim())
          ) {
            cancelled_qs += 1;
            continue;
          }

          if (selected_answer === null) {
            total_qs += 1;
            continue;
          }

          if (parseInt(correct_answer) === parseInt(selected_answer)) {
            score += 4;
            correct_qs += 1;
          } else {
            score -= 1;
            incorrect_qs += 1;
          }

          attempted_qs += 1;
          total_qs += 1;
        }

        allResults += `
          <div class="exam-result">
            <h2 class="exam-title">${exam_name}</h2>
            <div class="score-display">
              <span class="score-value">${score}</span>
              <span class="score-label">Final Score</span>
            </div>
            <div class="stats-grid">
              <div class="stat"><span class="stat-lbl">Attempted</span><span class="stat-val">${attempted_qs}</span></div>
              <div class="stat"><span class="stat-lbl">Correct</span><span class="stat-val">${correct_qs}</span></div>
              <div class="stat"><span class="stat-lbl">Incorrect</span><span class="stat-val">${incorrect_qs}</span></div>
              <div class="stat"><span class="stat-lbl">Cancelled</span><span class="stat-val">${cancelled_qs}</span></div>
              <div class="stat"><span class="stat-lbl">Total Questions</span><span class="stat-val">${total_qs}</span></div>
            </div>
          </div>
        `;
      } catch (examError) {
        console.error(`Error processing exam ${exam_id}:`, examError);
        allResults += `
          <div class="exam-error">
            <div class="exam-error-title">${exam_name}</div>
            <div class="exam-error-desc">Error loading exam data. Please try again later.</div>
          </div>
        `;
      }
    }

    resultsDiv.innerHTML = allResults;
  } catch (error) {
    console.error("Error occurred:", error);
    // Error UI is handled inside login/fetch catches
  }
}

document.getElementById("calculate").addEventListener("click", main);
