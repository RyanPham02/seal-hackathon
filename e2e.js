const BASE_URL = 'http://localhost:5050/api';

let currentCookie = "";

async function fetchApi(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', 'Origin': 'http://localhost:3000', ...options.headers };
    if (currentCookie) {
        headers['Cookie'] = currentCookie;
    }
    
    try {
        const res = await fetch(url, { ...options, headers });
        
        // Extract Set-Cookie
        const setCookie = res.headers.get('set-cookie');
        if (setCookie) {
            const match = setCookie.match(/seal_token=([^;]+)/);
            if (match) {
                currentCookie = `seal_token=${match[1]}`;
            }
        }

        const text = await res.text();
        if (res.status >= 400) {
            console.error(`HTTP ${res.status} from ${url}:`, text);
        }
        try {
            return { status: res.status, data: JSON.parse(text) };
        } catch {
            return { status: res.status, data: text };
        }
    } catch (err) {
        console.error(`Error calling ${url}:`, err.message);
        throw err;
    }
}

async function run() {
    try {
        console.log("🚀 Bắt đầu giả lập E2E...");
        
        // 1. Admin Login
        console.log("👉 Đăng nhập Admin...");
        currentCookie = ""; // clear cookie
        const adminLogin = await fetchApi('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@seal.net', password: 'Password123!' })
        });
        if (adminLogin.status !== 200) {
            console.error("Login failed with status:", adminLogin.status, "data:", adminLogin.data);
            throw new Error("Admin login failed");
        }
        const adminCookie = currentCookie;
        console.log("✅ Admin OK");

        // 2. Fetch Events
        let eventsRes = await fetchApi('/Events');
        if (!eventsRes.data || eventsRes.data.length === 0) {
            console.log("👉 Tạo Event mới vì Database rỗng...");
            currentCookie = adminCookie;
            const createEventRes = await fetchApi('/Events', {
                method: 'POST',
                body: JSON.stringify({
                    eventName: "SEAL Hackathon 2026",
                    description: "Auto-generated for E2E Test",
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 86400000).toISOString(),
                    status: 1
                })
            });
            if (createEventRes.status !== 201) throw new Error("Failed to create event");
            console.log("✅ Đã tạo Event thành công!");
            eventsRes = await fetchApi('/Events');
        }
        const eventId = eventsRes.data[0].eventId;
        const categoryId = eventsRes.data[0].categories[0].categoryId;
        const roundId = eventsRes.data[0].rounds[0].roundId;
        console.log(`✅ Lấy Event OK. EventID: ${eventId}, Track: ${categoryId}`);

        // 3. Register Student A, B, C
        console.log("👉 Đăng ký Student A, B, C...");
        const ts = Date.now();
        const emailA = `studentA_${ts}@seal.net`;
        const emailB = `studentB_${ts}@seal.net`;
        const emailC = `studentC_${ts}@seal.net`;
        
        const registerA = await fetchApi('/Auth/register', { method: 'POST', body: JSON.stringify({
            email: emailA, password: 'Password123!', fullName: 'Student A', studentCode: `SE123A_${ts}`, schoolName: 'FPT', studentType: 1
        })});
        const registerB = await fetchApi('/Auth/register', { method: 'POST', body: JSON.stringify({
            email: emailB, password: 'Password123!', fullName: 'Student B', studentCode: `SE123B_${ts}`, schoolName: 'FPT', studentType: 1
        })});
        const registerC = await fetchApi('/Auth/register', { method: 'POST', body: JSON.stringify({
            email: emailC, password: 'Password123!', fullName: 'Student C', studentCode: `SE123C_${ts}`, schoolName: 'FPT', studentType: 1
        })});
        if (registerA.status !== 200 || registerB.status !== 200 || registerC.status !== 200) throw new Error("Register failed");
        console.log("✅ Đăng ký OK");

        // 4. Admin Approves Users
        console.log("👉 Admin duyệt User...");
        currentCookie = adminCookie;
        const usersRes = await fetchApi('/admin/users/pending');
        if (usersRes.data) {
            for (const user of usersRes.data) {
                await fetchApi(`/admin/users/${user.id}/approve`, { method: 'PUT' });
            }
        }
        console.log("✅ Admin duyệt OK");

        // 5. Login Student A & B
        currentCookie = "";
        const loginA = await fetchApi('/Auth/login', { method: 'POST', body: JSON.stringify({ email: emailA, password: 'Password123!' }) });
        const cookieA = currentCookie;
        
        currentCookie = "";
        const loginB = await fetchApi('/Auth/login', { method: 'POST', body: JSON.stringify({ email: emailB, password: 'Password123!' }) });
        const cookieB = currentCookie;
        console.log("✅ Sinh viên Đăng nhập OK");

        // 6. Create Team (Student A)
        console.log("👉 Student A tạo nhóm...");
        currentCookie = cookieA;
        const createTeamRes = await fetchApi('/Teams', {
            method: 'POST',
            body: JSON.stringify({ 
                teamName: `Team_${ts}`, 
                categoryId: categoryId,
                memberStudentCodesOrEmails: [emailB, emailC]
            })
        });
        if (createTeamRes.status !== 200 && createTeamRes.status !== 201) {
            console.error("Error creating team:", createTeamRes.data);
            throw new Error("Tạo nhóm thất bại");
        }
        console.log("✅ Nhóm tạo OK");

        // 7. Get My Team for Student A
        currentCookie = cookieA;
        const myTeamRes = await fetchApi('/Teams/my-team');
        const teamId = myTeamRes.data.teamId || myTeamRes.data.id;

        // 7.5 Admin Approves Team
        console.log("👉 Admin duyệt Team...");
        currentCookie = adminCookie;
        await fetchApi(`/admin/teams/${teamId}/approve`, { method: 'PUT' });
        console.log("✅ Admin duyệt Team OK");

        // 8. Submit Project
        console.log("👉 Submit Project...");
        currentCookie = cookieA;
        const submitRes = await fetchApi(`/Submissions`, {
            method: 'POST',
            body: JSON.stringify({
                teamId: teamId,
                roundId: roundId,
                title: "Dự án xuất sắc",
                repositoryUrl: "https://github.com/abc",
                demoUrl: "https://demo.abc"
            })
        });
        if (submitRes.status !== 200 && submitRes.status !== 201) {
            console.error("Error submitting:", submitRes.data);
            throw new Error("Submit thất bại");
        }
        console.log("✅ Submit OK");

        // 9. Admin scores the submission (as a judge would)
        console.log("👉 Lấy danh sách Criteria của Round...");
        const criteriaRes = await fetchApi(`/rounds/${roundId}/criteria`);
        const criteriaId = criteriaRes.data && criteriaRes.data.length > 0 ? criteriaRes.data[0].criteriaId : "00000000-0000-0000-0000-000000000000";

        console.log("👉 Chấm điểm...");
        currentCookie = adminCookie;
        const scoreRes = await fetchApi(`/judge/scores/evaluation`, {
            method: 'POST',
            body: JSON.stringify({
                submissionId: submitRes.data?.submissionId || submitRes.data?.id || (await fetchApi(`/Submissions/team/${teamId}`)).data?.[0]?.submissionId,
                finalize: true,
                scores: [{
                    criteriaId: criteriaId,
                    scoreValue: 95,
                    comment: "Rất tốt!"
                }]
            })
        });
        if (scoreRes.status !== 200 && scoreRes.status !== 201) {
            console.error("Lỗi chấm điểm:", scoreRes.data);
            throw new Error("Chấm điểm thất bại");
        }
        console.log("✅ Chấm điểm OK");

        console.log("🎉 Xong kịch bản giả lập cơ bản.");

    } catch (e) {
        console.error("LỖI KỊCH BẢN:", e);
    }
}

run();
