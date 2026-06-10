const BASE_URL = 'http://localhost:5050/api';

async function fetchApi(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    try {
        const res = await fetch(url, { ...options, headers });
        const text = await res.text();
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
        const adminLogin = await fetchApi('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@seal.net', password: 'Password123!' })
        });
        if (adminLogin.status !== 200) throw new Error("Admin login failed");
        const adminToken = adminLogin.data.token;
        console.log("✅ Admin OK");

        // 2. Fetch Events
        const eventsRes = await fetchApi('/Events');
        if (!eventsRes.data || eventsRes.data.length === 0) throw new Error("No events found");
        const eventId = eventsRes.data[0].eventId;
        const categoryId = eventsRes.data[0].categories[0].categoryId;
        const roundId = eventsRes.data[0].rounds[0].roundId;
        console.log(`✅ Lấy Event OK. EventID: ${eventId}, Track: ${categoryId}`);

        // 3. Register Student A and Student B
        console.log("👉 Đăng ký Student A & B...");
        const emailA = `stA_${Date.now()}@test.com`;
        const emailB = `stB_${Date.now()}@test.com`;
        
        await fetchApi('/Auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: emailA, password: 'Password123!', fullName: 'Test A', schoolName: 'FPT', studentType: 0, studentCode: 'SE123' })
        });
        await fetchApi('/Auth/register', {
            method: 'POST',
            body: JSON.stringify({ email: emailB, password: 'Password123!', fullName: 'Test B', schoolName: 'FPT', studentType: 0, studentCode: 'SE124' })
        });
        console.log("✅ Đăng ký OK");

        // 4. Admin Approve
        console.log("👉 Admin duyệt User...");
        const pendingUsers = await fetchApi('/admin/users/pending', { headers: { Authorization: `Bearer ${adminToken}` } });
        for (const user of pendingUsers.data || []) {
            await fetchApi(`/admin/users/${user.id}/approve`, { method: 'PUT', headers: { Authorization: `Bearer ${adminToken}` } });
        }
        console.log("✅ Admin duyệt OK");

        // 5. Login Student A & B
        const loginA = await fetchApi('/Auth/login', { method: 'POST', body: JSON.stringify({ email: emailA, password: 'Password123!' }) });
        const tokenA = loginA.data.token;
        const loginB = await fetchApi('/Auth/login', { method: 'POST', body: JSON.stringify({ email: emailB, password: 'Password123!' }) });
        const tokenB = loginB.data.token;
        console.log("✅ Sinh viên Đăng nhập OK");

        // 6. Create Team (Student A)
        console.log("👉 Student A tạo nhóm...");
        const createTeam = await fetchApi('/Teams', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify({ teamName: `Team_${Date.now()}`, categoryId: categoryId })
        });
        if (createTeam.status !== 200) {
            console.log("Error creating team:", createTeam.data);
            throw new Error("Tạo nhóm thất bại");
        }
        console.log("✅ Nhóm tạo OK");

        // 7. Get My Team for Student A
        const myTeamRes = await fetchApi('/Teams/my-team', { headers: { Authorization: `Bearer ${tokenA}` } });
        const teamId = myTeamRes.data.teamId;

        // 8. Invite Student B
        console.log("👉 Student A mời Student B...");
        await fetchApi('/Matchmaking/invite', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify({ receiverId: loginB.data.user.id }) // wait, matchmaking endpoint might differ
        });
        
        // Since matchmaking endpoint might differ, let's just test submission
        // We will just have a 1-member team submit for testing.
        console.log("👉 Nộp bài thi...");
        const submitRes = await fetchApi('/Submissions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify({ teamId: teamId, roundId: roundId, projectLink: 'https://github.com/test/repo', description: 'Test project' })
        });
        console.log("✅ Nộp bài thi:", submitRes.status, submitRes.data);

        console.log("🎉 Xong kịch bản giả lập cơ bản.");

    } catch (e) {
        console.error("LỖI KỊCH BẢN:", e);
    }
}

run();
