import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

  const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
      cookies: {
          getAll() {
          return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
              request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
          )
          },
      },
      }
  )

  const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/sign-up'

  if(isAuthRoute){
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if(user){
      return NextResponse.redirect(
        new URL('/', process.env.NEXT_PUBLIC_BASE_URL)
      )
    }
  }

  const { searchParams, pathname } = new URL(request.url)

  if(!searchParams.get('noteId') && pathname === '/'){
      const {
      data: { user },
    } = await supabase.auth.getUser()

    if(user){
      const { newestNoteId } = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/fetch-newest-note?userId=${user.id}`)
        .then((res) => res.json())
        
        if(newestNoteId){
          //Build url and redirect
          const url = request.nextUrl.clone()
          url.searchParams.set("noteId", newestNoteId)
          return NextResponse.redirect(url) //reroutes to newest note in db
        } else {
          const { noteId } = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/create-new-note?userId=${user.id}`, 
            {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }).then((res) => res.json())

          const url = request.nextUrl.clone()
          url.searchParams.set("noteId", noteId)
          return NextResponse.redirect(url) //reroutes to empty note
        }
    }
  }

  return supabaseResponse;

}

