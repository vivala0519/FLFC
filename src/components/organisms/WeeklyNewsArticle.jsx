import { marked } from 'marked'
import CloseIcon from '@/assets/lucide/x.svg?react'
import './WeeklyNewsArticle.css'

// Render Markdown as React nodes, never as raw HTML from a remote document.
const inlineNodes = (tokens = []) => tokens.map((token, index) => {
  const children = token.tokens ? inlineNodes(token.tokens) : token.text
  switch (token.type) {
    case 'strong': return <strong key={index}>{children}</strong>
    case 'em': return <em key={index}>{children}</em>
    case 'del': return <del key={index}>{children}</del>
    case 'codespan': return <code key={index}>{token.text}</code>
    case 'br': return <br key={index} />
    case 'escape': return <span key={index}>{token.text}</span>
    default: return <span key={index}>{children ?? token.raw}</span>
  }
})

const blockNodes = (tokens = []) => tokens.map((token, index) => {
  switch (token.type) {
    case 'space': return null
    case 'heading': return <h3 key={index}>{inlineNodes(token.tokens)}</h3>
    case 'paragraph':
    case 'text': return <p key={index}>{token.tokens ? inlineNodes(token.tokens) : token.text}</p>
    case 'list': {
      const List = token.ordered ? 'ol' : 'ul'
      return <List key={index} start={token.ordered ? token.start : undefined}>
        {token.items.map((item, itemIndex) => <li key={itemIndex}>{blockNodes(item.tokens)}</li>)}
      </List>
    }
    case 'blockquote': return <blockquote key={index}>{blockNodes(token.tokens)}</blockquote>
    case 'hr': return <hr key={index} />
    case 'code': return <pre key={index}><code>{token.text}</code></pre>
    default: return <p key={index}>{token.text || token.raw}</p>
  }
})

const Markdown = ({ text }) => blockNodes(marked.lexer(typeof text === 'string' ? text : '', { gfm: true, breaks: true }))
const plainHeading = (text) => text.replace(/^[^\p{L}\p{N}]+/u, '')
const numberLabel = (value) => Number.isFinite(value) ? value : '-'

const TeamResults = ({ teams }) => (
  <div className="weekly-news__table-scroll">
    <table className="weekly-news__teams">
      <caption className="sr-only">팀별 경기 결과</caption>
      <thead><tr><th scope="col">팀</th><th scope="col">승</th><th scope="col">무</th><th scope="col">패</th><th scope="col">득 / 실</th><th scope="col">승점</th></tr></thead>
      <tbody>{teams.map((team, index) => (
        <tr key={team.team}>
          <th scope="row"><span className="weekly-news__rank">{index + 1}위</span>{team.team}팀</th>
          <td>{numberLabel(team.win)}</td><td>{numberLabel(team.draw)}</td><td>{numberLabel(team.loss)}</td>
          <td>{numberLabel(team.goalsFor)} / {numberLabel(team.goalsAgainst)}</td>
          <td className="weekly-news__points">{numberLabel(team.points)}</td>
        </tr>
      ))}</tbody>
    </table>
  </div>
)

const WeeklyNewsArticle = ({ news, dateId, onClose }) => {
  const date = /^\d{6}$/.test(dateId) ? `20${dateId.slice(0, 2)}.${dateId.slice(2, 4)}.${dateId.slice(4, 6)}` : ''
  const title = (news.title || news.titleShort || '이번 주 경기 소식').replace(/^\[FLFC 뉴스\]\s*/, '')
  const articleSections = (Array.isArray(news.sections) ? news.sections : [])
    .filter((section) => typeof section.heading === 'string' && typeof section.text === 'string')
  const sections = articleSections.filter((section) => !/mvp/i.test(section.heading))
  const teamSections = sections.filter((section) => section.heading.includes('팀 결과'))
  const otherSections = sections.filter((section) => !section.heading.includes('팀 결과'))
  const teams = Array.isArray(news.teams) ? news.teams : []
  const mvp = Array.isArray(news.mvp) ? news.mvp : []
  const bodyTokens = marked.lexer(typeof news.body === 'string' ? news.body : '', { gfm: true, breaks: true })
  const firstSection = bodyTokens.findIndex((token) => token.type === 'heading' && token.depth === 2)
  const introduction = (firstSection < 0 ? [] : bodyTokens.slice(0, firstSection)).filter((token) =>
    token.type === 'paragraph' && !/^\*\*\d{4}년/.test(token.raw),
  )

  return (
    <div className="weekly-news">
      <header className="weekly-news__toolbar">
        <span>FLFC <span className="weekly-news__toolbar-divider">/</span> 주간 경기 리포트</span>
        <button type="button" className="weekly-news__close" onClick={onClose} aria-label="신문 닫기" title="신문 닫기" autoFocus>
          <CloseIcon aria-hidden="true" />
        </button>
      </header>
      <div className="weekly-news__scroll" tabIndex={0} role="region" aria-label="주간신문 본문">
        <article className="weekly-news__paper">
          <div className="weekly-news__masthead">
            <p className="weekly-news__edition"><time dateTime={news.date || date.replaceAll('.', '-')}>{date}</time></p>
            <div className="weekly-news__brand"><img src="/icon3-192.png" width="36" height="36" alt="" /><span>FLFC 주간뉴스</span></div>
          </div>
          <div className="weekly-news__headline">
            <p className="weekly-news__eyebrow">MATCH REPORT</p>
            <h2 id="news-pending-title">{title}</h2>
            {news.summary && <p className="weekly-news__summary">{news.summary}</p>}
          </div>
          {teamSections.map((section, index) => (
            <section className="weekly-news__section" key={`${index}-${section.heading}`}>
              <div className="weekly-news__section-heading"><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3>{plainHeading(section.heading)}</h3></div>
              {teams.length > 0 && <TeamResults teams={teams} />}
            </section>
          ))}
          {mvp.length > 0 && <section className="weekly-news__mvp" aria-label="이번 주 MVP">
            <p className="weekly-news__eyebrow">PLAYER OF THE WEEK</p>
            {mvp.map((player) => (
              <div className="weekly-news__mvp-player" key={player.name}>
                <div className="weekly-news__mvp-name"><span>이번 주 MVP</span><strong>{player.name}</strong></div>
                <dl className="weekly-news__mvp-stats">
                  <div><dt>골</dt><dd>{numberLabel(player.goals)}</dd></div>
                  <div><dt>어시</dt><dd>{numberLabel(player.assists)}</dd></div>
                  <div><dt>공격포인트</dt><dd>{Number.isFinite(player.goals) && Number.isFinite(player.assists) ? player.goals + player.assists : '-'}</dd></div>
                </dl>
              </div>
            ))}
          </section>}
          {articleSections.length > 0 ? <>
            {introduction.length > 0 && <div className="weekly-news__prose weekly-news__intro">{blockNodes(introduction)}</div>}
            {otherSections.map((section, index) => (
              <section className="weekly-news__section" key={`${index}-${section.heading}`}>
                <div className="weekly-news__section-heading"><span aria-hidden="true">{String(teamSections.length + index + 1).padStart(2, '0')}</span><h3>{plainHeading(section.heading)}</h3></div>
                <div className="weekly-news__prose"><Markdown text={section.text}/></div>
              </section>
            ))}
          </> : <div className="weekly-news__prose weekly-news__section"><Markdown text={news.body || news.bodyShort || '등록된 기사 본문이 없습니다.'} /></div>}
          <footer className="weekly-news__endnote"><span>FLFC</span><p></p><time>{date}</time></footer>
        </article>
      </div>
      <footer className="weekly-news__footer"><span>FLFC WEEKLY</span><span>{date}</span></footer>
    </div>
  )
}

export default WeeklyNewsArticle
