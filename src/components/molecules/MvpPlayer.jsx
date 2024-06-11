import { useMemo } from 'react'

const MvpPlayer = ({player}) => {
  const containerStyle = 'flex flex-col'
  const playerNameStyle = 'underline decoration-2 decoration-double decoration-yellow-400 text-signature font-dnf-forged'
  const recodeStyle = 'text-vivaMagenta text-xs'
  const computedRecodeText = useMemo(() => {
    let text = '';
    if (Number(player.goal) > 0) {
      text += player.goal + '골';
    }
    if (Number(player.assist) > 0) {
      text += player.assist + '어시';
    }
    return text;
  }, [player.goal, player.assist]);

  return (
    <div className={containerStyle}>
      <span className={playerNameStyle}>{player.name}</span>
      <span className={recodeStyle}>
        {computedRecodeText}
      </span>
    </div>
  )
}
export default MvpPlayer