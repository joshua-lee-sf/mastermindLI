export const createUser = async (username, password) => {
    let res = await fetch('/api/users/register', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password
        })
    });
    if (res.ok){
        let data = await res.text();
        localStorage.setItem('sessionToken', data);
        location.reload();
    } else {
        const {error} = await res.json()
        throw new Error(error);
    };
};

export const loginUser = async (username, password) => {
    let res = await fetch('/api/users/login', {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        }),
        headers: {
            "Content-Type": 'application/json'
        }
    });
    if (!res.ok) {
        const {error} = await res.json();
        throw new Error (error);
    } else {
        const sessionToken = await res.json();
        localStorage.setItem('sessionToken', sessionToken);
        location.reload();
    };
};

export const getCurrentUser = async (sessionToken) => {
    let res = await fetch(`/api/users/getcurrentuser?sessionToken=${encodeURIComponent(sessionToken)}`, {
        method: 'GET',
    });
    let data = await res.json();
    return data
};