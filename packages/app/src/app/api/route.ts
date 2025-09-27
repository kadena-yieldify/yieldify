export async function GET() {
  return new Response(JSON.stringify({ data: 'Hello World!' }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
