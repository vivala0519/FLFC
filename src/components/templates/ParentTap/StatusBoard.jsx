import {useEffect, useState} from 'react'
import DataTable from '../../DataTable.jsx'
import styled from 'styled-components'
import './LetsRecord.css'
import help from '@/assets/help2.png'
import {dataAnalysis} from "../../../apis/analyzeData.js";

const StatusBoard = (props) => {
    const {propsData, setTap} = props

    const [analyzedData, setAnalyzedData] = useState({})
    const [lastSeasonKings, setLastSeasonKings] = useState({goal_king: '', assist_king: '', attendance_king: []})
    const [isLastElementInViewport, setIsLastElementInViewport] = useState(false)
    const [isFirstElementInViewport, setIsFirstElementInViewport] = useState(false)

    const fetchAnalysis = async () => {
        const data = await dataAnalysis(0)
        setAnalyzedData(data)
    }

    useEffect(() => {
        fetchAnalysis()
    }, [])


    useEffect(() => {
        if (analyzedData['active']) {
            setLastSeasonKings(analyzedData['active']['lastSeasonKings'])
        }
    }, [analyzedData])

    // 슬라이드 시 탭 이동
    const [startX, setStartX] = useState(null)
    const [moveX, setMoveX] = useState(null)

    const handleTouchStart = (e) => {
        setStartX(e.touches[0].clientX)
        setMoveX(e.touches[0].clientX)
        const isElementInViewport = (element) => {
            const rect = element.getBoundingClientRect()
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );
        };

        const firstElement = document.getElementById('first_element')
        const lastElement = document.getElementById('last_element')
        setIsFirstElementInViewport(isElementInViewport(firstElement))
        setIsLastElementInViewport(isElementInViewport(lastElement))
    };

    const handleTouchMove = (e) => {
        setMoveX(e.touches[0].clientX);
    };

    const handleTouchEnd = (e) => {
        const diff = startX - moveX;
        if (diff > 75 && isLastElementInViewport) {
            setTap(2);
        } else if (diff < -75 && isFirstElementInViewport) {
            setTap(0);
        }
        setStartX(null);
        setMoveX(null);
        setIsLastElementInViewport(false)
        setIsFirstElementInViewport(false)
    };


    return (
      <div className='w-full relative' style={{top: '-10px'}}  onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div>
          <DataTable tap={'현황판'} tableData={propsData} analyzedData={analyzedData} lastSeasonKings={lastSeasonKings} />
        </div>
      </div>
  )
}

export default StatusBoard

const Help = styled.div`
    position: absolute;
    right: 0;
    width: 20px;
    height: 20px;
    &::after {
        position: absolute;
        content: '';
        background-image: url(${help});
        background-position: center;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        width: 100%;
        height: 100%;
        right: 0;
    }
`

const Tap = styled.div`
    @media (min-width: 812px) {
        font-size: 21px;
    }
`