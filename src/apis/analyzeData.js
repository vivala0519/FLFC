import {collection, doc, getDoc, getDocs} from 'firebase/firestore'
import { db } from '../../firebase.js'

export const dataAnalysis = async () => {
    const collectionRef = collection(db, '2024')
    const snapshot = await getDocs(collectionRef)
    const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
    const weeks = fetchedData.length
    const totalStats = new Map()

    // 이름별 통계 취합
    fetchedData.forEach(item => {
        const idData = item.data
        for (const name in idData) {
            if (Object.prototype.hasOwnProperty.call(idData, name)) {
                const stats = idData[name]
                if (!totalStats.has(name)) {
                    totalStats.set(name, { '골': 0, '어시': 0, '출석': 0 })
                }
                const existingStats = totalStats.get(name)
                existingStats['골'] += parseInt(stats['골'] || 0)
                existingStats['어시'] += parseInt(stats['어시'] || 0)
                existingStats['출석'] += stats['출석'] ? 1 : 0
            }
        }
    });
    totalStats.forEach((value, key) => {
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
    const totalStatsArray = Array.from(totalStats.entries());
    // 골 순위
    const goalRank = totalStatsArray.sort((a, b) => b[1]['골'] - a[1]['골'])
    let prevGoal = null, prevGoalRank = 1;
    goalRank.forEach((item, index) => {
        if (prevGoal === item[1]['골']) {
            totalStats.get(item[0])['골순위'] = prevGoalRank;
        } else {
            prevGoal = item[1]['골'];
            prevGoalRank = index + 1;
            totalStats.get(item[0])['골순위'] = prevGoalRank;
        }
    })
    // 어시 순위
    const assistRank = totalStatsArray.sort((a, b) => b[1]['어시'] - a[1]['어시'])
    let prevAssist = null, prevAssistRank = 1;
    assistRank.forEach((item, index) => {
        if (prevAssist === item[1]['어시']) {
            totalStats.get(item[0])['어시순위'] = prevAssistRank;
        } else {
            prevAssist = item[1]['어시'];
            prevAssistRank = index + 1;
            totalStats.get(item[0])['어시순위'] = prevAssistRank;
        }
    })
    // 출석 순위
    const showRank = totalStatsArray.sort((a, b) => b[1]['출석'] - a[1]['출석'])
    let prevShow = null, prevShowRank = 1;
    showRank.forEach((item, index) => {
        if (prevShow === item[1]['출석']) {
            totalStats.get(item[0])['출석순위'] = prevShowRank;
        } else {
            prevShow = item[1]['출석'];
            prevShowRank = index + 1;
            totalStats.get(item[0])['출석순위'] = prevShowRank;
        }
    })
    // 공격포인트 순위
    const attackPointRank = totalStatsArray.sort((a, b) => b[1]['공격포인트'] - a[1]['공격포인트'])
    let prevAttackPoint = null, prevAttackPointRank = 1;
    attackPointRank.forEach((item, index) => {
        if (prevAttackPoint === item[1]['공격포인트']) {
            totalStats.get(item[0])['공격포인트순위'] = prevAttackPointRank;
        } else {
            prevAttackPoint = item[1]['공격포인트'];
            prevAttackPointRank = index + 1;
            totalStats.get(item[0])['공격포인트순위'] = prevAttackPointRank;
        }
    })
    // 포인트 총합 순위
    const totalPointRank = totalStatsArray.sort((a, b) => b[1]['포인트총합'] - a[1]['포인트총합'])
    let prevTotalPoint = null, prevTotalPointRank = 1;
    totalPointRank.forEach((item, index) => {
        if (prevTotalPoint === item[1]['포인트총합']) {
            totalStats.get(item[0])['포인트총합순위'] = prevTotalPointRank;
        } else {
            prevTotalPoint = item[1]['포인트총합'];
            prevTotalPointRank = index + 1;
            totalStats.get(item[0])['포인트총합순위'] = prevTotalPointRank;
        }
    })
    const members = extractActiveMembers(totalStats)
    return {members: members, totalData: totalStats}
}

const extractActiveMembers = (totalStats) => {
    const names = ['홍원진', '우장식', '임희재', '윤희철', '김동휘', '이승호', '임건휘', '방승진', '김민관', '김규진', '임준휘', '전희종', '한상태', '임종우', '노태훈', '윤영진', '이원효', '황정민', '양대열', '정우진', '김남구', '박근한', '손지원', '황철민', '최봉호', '선민조', '최수혁', '김병일', '김대건', '전의준', '황은집', '진장용', '이진헌', '윤준석', '김동주', '선우용', '이재진', '김성록', '박남호', '안용현', '이종호', '장성민', '하민수']
    const includedNames = names.filter(name => totalStats.has(name))
    const excludedNames = names.filter(name => !totalStats.has(name))

    return {active: includedNames, inactive: excludedNames}
}
export default {
    dataAnalysis,
}