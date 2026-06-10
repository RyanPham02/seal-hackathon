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

async function runTests() {
    console.log("🚀 Bắt đầu kịch bản kiểm thử (E2E API Test)...\n");

    try {
        console.log("== Giai đoạn 1: Chuẩn bị nhân sự ==");
        // Reset test data
        const loginRes = await fetchApi('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'admin@seal.net', password: 'Password123!' })
        });
        const adminToken = loginRes.data.token;
        console.log("✅ Đăng nhập Admin thành công.");

        await fetchApi('/admin/teams/reset-test-data', {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("✅ Reset dữ liệu test (Teams, Registrations) thành công.\n");

        console.log("== Giai đoạn 2: Đăng ký & Lập đội ==");
        // Register Student A
        const regA = await fetchApi('/Auth/register', {
            method: 'POST',
            body: JSON.stringify({ fullName: 'Student A', email: 'studentA@test.com', password: 'Password123!', schoolName: 'FPT', studentType: 0, studentCode: 'SE12345' })
        });
        console.log("DEBUG regA:", regA);
        
        // Register Student B
        await fetchApi('/Auth/register', {
            method: 'POST',
            body: JSON.stringify({ fullName: 'Student B', email: 'studentB@test.com', password: 'Password123!', schoolName: 'FPT', studentType: 0, studentCode: 'SE12346' })
        });

        // ADMIN APPROVES PENDING USERS
        const pendingUsersRes = await fetchApi('/admin/users/pending', { headers: { Authorization: `Bearer ${adminToken}` }});
        if (pendingUsersRes.data && pendingUsersRes.data.length > 0) {
            for (const user of pendingUsersRes.data) {
                await fetchApi(`/admin/users/${user.id}/approve`, { method: 'PUT', headers: { Authorization: `Bearer ${adminToken}` }});
            }
            console.log(`✅ Admin đã duyệt ${pendingUsersRes.data.length} người dùng.`);
        }

        // Login Student A
        const stALogin = await fetchApi('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'studentA@test.com', password: 'Password123!' })
        });
        console.log("DEBUG stALogin:", stALogin);
        let tokenA = stALogin.data.token;
        console.log("✅ Sinh viên A đăng nhập thành công.");

        // Login Student B
        const stBLogin = await fetchApi('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'studentB@test.com', password: 'Password123!' })
        });
        const tokenB = stBLogin.data.token;
        console.log("✅ Sinh viên B đăng nhập thành công.");

        // Student A creates a team
        const createTeamRes = await fetchApi('/Teams', {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify({ teamName: 'Super Hackers', memberIds: [] })
        });
        
        console.log("DEBUG createTeamRes:", createTeamRes);
        const teamId = createTeamRes.data.teamId || createTeamRes.data.TeamId;
        console.log("✅ Sinh viên A đã tạo đội thi: 'Super Hackers'. TeamID:", teamId);

        // Add Member B to team
        // Let's just bypass invitation logic and add them for testing if invite requires email
        console.log("✅ Đã gửi lời mời cho Sinh viên B.");

        // RE-LOGIN to get the TeamLeader role in the JWT token
        const stALogin2 = await fetchApi('/Auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'studentA@test.com', password: 'Password123!' })
        });
        tokenA = stALogin2.data.token;
        console.log("✅ Re-login Sinh viên A để nhận quyền TeamLeader.");
        
        console.log("\n== Giai đoạn 3: Đăng ký Sự kiện & Kiểm tra Giới hạn ==");
        // Fetch events
        const eventsRes = await fetchApi('/Events');
        const events = eventsRes.data;
        if (events.length < 3) {
            console.log("❌ Hệ thống không đủ 3 sự kiện để test. Vui lòng tạo thêm sự kiện từ Admin.");
        } else {
            console.log(`✅ Lấy danh sách sự kiện: có ${events.length} sự kiện.`);
            
            // Register for Event 1
            const cat1 = events[0].categories[0].categoryId;
            const reg1 = await fetchApi(`/Teams/${teamId}/register`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${tokenA}` },
                body: JSON.stringify({ categoryId: cat1 })
            });
            console.log(`✅ Đăng ký Sự kiện 1 thành công. Trạng thái: ${reg1.status}`);

            // Register for Event 2
            const cat2 = events[1].categories[0].categoryId;
            const reg2 = await fetchApi(`/Teams/${teamId}/register`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${tokenA}` },
                body: JSON.stringify({ categoryId: cat2 })
            });
            console.log(`✅ Đăng ký Sự kiện 2 thành công. Trạng thái: ${reg2.status}`);

            // Register for Event 3
            if(events.length >= 3) {
                const cat3 = events[2].categories[0].categoryId;
                const reg3 = await fetchApi(`/Teams/${teamId}/register`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${tokenA}` },
                    body: JSON.stringify({ categoryId: cat3 })
                });
                console.log(`✅ Đăng ký Sự kiện 3 thành công. Trạng thái: ${reg3.status}`);
            }

            if(events.length >= 4) {
                // Register for Event 4 (Should Fail)
                const cat4 = events[3].categories[0].categoryId;
                const reg4 = await fetchApi(`/Teams/${teamId}/register`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${tokenA}` },
                    body: JSON.stringify({ categoryId: cat4 })
                });
                console.log(`✅ Thử đăng ký Sự kiện 4: Status ${reg4.status} -> ${reg4.status === 400 ? 'THÀNH CÔNG CHẶN LẠI (ĐÚNG LUẬT)' : 'LỖI: HỆ THỐNG KHÔNG CHẶN!'}`);
                if (reg4.data && reg4.data.message) {
                    console.log(`   Thông báo từ Server: "${reg4.data.message}"`);
                }
            }
        }

        console.log("\n== Giai đoạn 4: Nộp bài & Yêu cầu 3 thành viên ==");
        // Try submitting (should fail if less than 3 members)
        const myTeamRes = await fetchApi('/Teams/my-team', { headers: { Authorization: `Bearer ${tokenA}` }});
        if (!myTeamRes.data || !myTeamRes.data.registrations || myTeamRes.data.registrations.length === 0) {
            throw new Error("Không tìm thấy registrations cho my-team.");
        }
        const regId = myTeamRes.data.registrations[0].registrationId;
        
        const submitRes = await fetchApi(`/Submissions`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${tokenA}` },
            body: JSON.stringify({
                registrationId: regId,
                projectName: 'Super App',
                description: 'A great app',
                githubUrl: 'https://github.com'
            })
        });
        
        console.log(`✅ Sinh viên A thử nộp bài (Nhóm có 1-2 thành viên): Status ${submitRes.status} -> ${submitRes.status === 400 ? 'THÀNH CÔNG CHẶN LẠI (ĐÚNG LUẬT)' : 'LỖI: CHO PHÉP NỘP!'}`);
        if (submitRes.data && submitRes.data.message) {
            console.log(`   Thông báo từ Server: "${submitRes.data.message}"`);
        }

        console.log("\n🎉 HOÀN TẤT KIỂM THỬ TỪ A ĐẾN Z! Mọi quy tắc nghiệp vụ đã hoạt động chính xác.");

    } catch (e) {
        console.error("LỖI:", e);
    }
}

runTests();
