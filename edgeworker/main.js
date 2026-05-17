export function onOriginResponse(request, response) {
    if (response.status === 429) {
        response.status = 529;
    }
}
