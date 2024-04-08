import {collection, getDocs} from 'firebase/firestore'
import { db } from '../../firebase.js'

export const dataAnalysis = async (quarter) => {
    const year = '2024'
    const collectionRef = collection(db, year)
    const snapshot = await getDocs(collectionRef)
    const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))

    // 현황판 데이터 Map
    let activeQuarterStats = null

    const generateByQuarter = (quarterData, quarterStats) => {
        quarterData?.forEach(item => {
            const idData = item.data
            for (const name in idData) {
                if (Object.prototype.hasOwnProperty.call(idData, name)) {
                    const stats = idData[name]
                    if (!quarterStats.has(name)) {
                        quarterStats.set(name, { '골': 0, '어시': 0, '출석': 0 })
                    }
                    const existingStats = quarterStats.get(name)
                    existingStats['골'] += parseInt(stats['골'] || 0)
                    existingStats['어시'] += parseInt(stats['어시'] || 0)
                    existingStats['출석'] += stats['출석'] ? 1 : 0
                }
            }
        })
    }

    const lastSeasonKings = fetchedData.find(data => data.id === 'last_season_kings').data

    // 1분기 이름별 통계 취합
    const firstQuarter = fetchedData.filter(item => Number(item.id.slice(0, 2)) <= 3)
    const firstQuarterStats = new Map()
    generateByQuarter(firstQuarter, firstQuarterStats)
    const firstQuarterData = {members: extractActiveMembers(firstQuarterStats), totalData: firstQuarterStats, lastSeasonKings: lastSeasonKings[Number(year) - 1 + '_4th']}

    // 2분기 이름별 통계 취합
    const secondQuarter = fetchedData.filter(item => Number(item.id.slice(0, 2)) > 3 && Number(item.id.slice(0, 2)) <= 6)
    const secondQuarterStats = new Map()
    generateByQuarter(secondQuarter, secondQuarterStats)
    const secondQuarterData = {members: extractActiveMembers(secondQuarterStats), totalData: secondQuarterStats, lastSeasonKings: lastSeasonKings[year + '_1st']}

    // 3분기 이름별 통계 취합
    const thirdQuarter = fetchedData.filter(item => Number(item.id.slice(0, 2)) > 6 && Number(item.id.slice(0, 2)) <= 9)
    const thirdQuarterStats = new Map()
    generateByQuarter(thirdQuarter, thirdQuarterStats)
    const thirdQuarterData = {members: extractActiveMembers(thirdQuarterStats), totalData: thirdQuarterStats, lastSeasonKings: lastSeasonKings[year + '_2nd']}

    // 4분기 이름별 통계 취합
    const fourthQuarter = fetchedData.filter(item => Number(item.id.slice(0, 2)) > 9)
    const fourthQuarterStats = new Map()
    generateByQuarter(fourthQuarter, fourthQuarterStats)
    const fourthQuarterData = {members: extractActiveMembers(fourthQuarterStats), totalData: fourthQuarterStats, lastSeasonKings: lastSeasonKings[year + '3rd']}

    let lastKings = null

    // 현재 월이 포함된 분기 찾기
    if (quarter) {
        if (quarter === 1) {
            activeQuarterStats = firstQuarterStats
        }
        else if (quarter === 2) {
            activeQuarterStats = secondQuarterStats
        }
        else if (quarter === 3) {
            activeQuarterStats = thirdQuarterStats
        }
        else {
            activeQuarterStats = fourthQuarterStats
        }
    } else {
        const currentTime = new Date()
        const currentMonth = currentTime.getMonth() + 1

        if (currentMonth <= 3) {
            activeQuarterStats = firstQuarterStats
            lastKings = lastSeasonKings[Number(year) - 1 + '_4th']
        }
        else if (currentMonth > 3 && currentMonth <= 6) {
            activeQuarterStats = secondQuarterStats
            lastKings = lastSeasonKings[year + '_1st']
            if (secondQuarterStats.size === 0) {
                activeQuarterStats = firstQuarterStats
                lastKings = lastSeasonKings[Number(year) - 1 + '_4th']
            }
        }
        else if (currentMonth > 6 && currentMonth <= 9) {
            activeQuarterStats = thirdQuarterStats
            lastKings = lastSeasonKings[year + '_2nd']
            if (thirdQuarterStats.size === 0) {
                activeQuarterStats = secondQuarterStats
                lastKings = lastSeasonKings[year + '_1st']
            }
        } else {
            activeQuarterStats = fourthQuarterStats
            lastKings = lastSeasonKings[year + '_3rd']
            if (fourthQuarterStats.size === 0) {
                activeQuarterStats = thirdQuarterStats
                lastKings = lastSeasonKings[year + '_2nd']
            }
        }
    }

    activeQuarterStats.forEach((value, key) => {
        value['포인트'] = value['골'] + value['어시'] + value['출석']
        value['일평균득점'] = parseFloat(Math.ceil((value['골'] / value['출석']) * 100) / 100)
        value['일평균어시'] = parseFloat(Math.ceil((value['어시'] / value['출석']) * 100) / 100)
        value['공격포인트'] = value['골'] + value['어시']
        value['포인트총합'] = value['포인트']
        value['골순위'] = 0
        value['어시순위'] = 0
        value['출석순위'] = 0
        value['공격포인트순위'] = 0
        value['포인트총합순위'] = 0
    })
    const totalStatsArray = Array.from(activeQuarterStats.entries())
    // 골 순위
    const goalRank = totalStatsArray.sort((a, b) => b[1]['골'] - a[1]['골'])
    let prevGoal = null, prevGoalRank = 1;
    goalRank.forEach((item, index) => {
        if (prevGoal === item[1]['골']) {
            activeQuarterStats.get(item[0])['골순위'] = prevGoalRank;
        } else {
            prevGoal = item[1]['골'];
            prevGoalRank = index + 1;
            activeQuarterStats.get(item[0])['골순위'] = prevGoalRank;
        }
    })
    // 어시 순위
    const assistRank = totalStatsArray.sort((a, b) => b[1]['어시'] - a[1]['어시'])
    let prevAssist = null, prevAssistRank = 1;
    assistRank.forEach((item, index) => {
        if (prevAssist === item[1]['어시']) {
            activeQuarterStats.get(item[0])['어시순위'] = prevAssistRank;
        } else {
            prevAssist = item[1]['어시'];
            prevAssistRank = index + 1;
            activeQuarterStats.get(item[0])['어시순위'] = prevAssistRank;
        }
    })
    // 출석 순위
    const showRank = totalStatsArray.sort((a, b) => b[1]['출석'] - a[1]['출석'])
    let prevShow = null, prevShowRank = 1;
    showRank.forEach((item, index) => {
        if (prevShow === item[1]['출석']) {
            activeQuarterStats.get(item[0])['출석순위'] = prevShowRank;
        } else {
            prevShow = item[1]['출석'];
            prevShowRank = index + 1;
            activeQuarterStats.get(item[0])['출석순위'] = prevShowRank;
        }
    })
    // 공격포인트 순위
    const attackPointRank = totalStatsArray.sort((a, b) => b[1]['공격포인트'] - a[1]['공격포인트'])
    let prevAttackPoint = null, prevAttackPointRank = 1;
    attackPointRank.forEach((item, index) => {
        if (prevAttackPoint === item[1]['공격포인트']) {
            activeQuarterStats.get(item[0])['공격포인트순위'] = prevAttackPointRank;
        } else {
            prevAttackPoint = item[1]['공격포인트'];
            prevAttackPointRank = index + 1;
            activeQuarterStats.get(item[0])['공격포인트순위'] = prevAttackPointRank;
        }
    })
    // 포인트 총합 순위
    const totalPointRank = totalStatsArray.sort((a, b) => b[1]['포인트총합'] - a[1]['포인트총합'])
    let prevTotalPoint = null, prevTotalPointRank = 1;
    totalPointRank.forEach((item, index) => {
        if (prevTotalPoint === item[1]['포인트총합']) {
            activeQuarterStats.get(item[0])['포인트총합순위'] = prevTotalPointRank;
        } else {
            prevTotalPoint = item[1]['포인트총합'];
            prevTotalPointRank = index + 1;
            activeQuarterStats.get(item[0])['포인트총합순위'] = prevTotalPointRank;
        }
    })
    const members = extractActiveMembers(activeQuarterStats)
    const activeQuarterData = {members: members, totalData: activeQuarterStats, lastSeasonKings: lastKings}

    return {active: activeQuarterData, totalQuarterData: [firstQuarterData, secondQuarterData, thirdQuarterData, fourthQuarterData]}
}

const extractActiveMembers = (totalStats) => {
    const names = ['홍원진', '우장식', '임희재', '윤희철', '김동휘', '이승호', '임건휘', '방승진', '김민관', '김규진', '임준휘', '전희종', '한상태', '임종우', '노태훈', '윤영진', '이원효', '황정민', '양대열', '정우진', '김남구', '박근한', '손지원', '황철민', '최봉호', '선민조', '최수혁', '김병일', '김대건', '전의준', '황은집', '진장용', '이진헌', '윤준석', '김동주', '선우용', '이재진', '김성록', '박남호', '안용현', '장성민', '하민수']
    const includedNames = names.filter(name => totalStats.has(name))
    const excludedNames = names.filter(name => !totalStats.has(name))

    return {active: includedNames, inactive: excludedNames}
}
export default {
    dataAnalysis,
}