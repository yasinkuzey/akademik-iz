import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function Games() {
    const { user } = useAuth()
    const [activeGame, setActiveGame] = useState<'menu' | 'puzzle' | 'xox' | 'sudoku'>('menu')

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-90 duration-700">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Zeka Oyunları & Bulmacalar 🎮</h1>
                {activeGame !== 'menu' && (
                    <button
                        onClick={() => setActiveGame('menu')}
                        className="text-sm font-medium text-[rgb(var(--accent))] hover:underline"
                    >
                        ← Oyunlara Dön
                    </button>
                )}
            </div>

            {activeGame === 'menu' && <GameMenu onSelect={setActiveGame} />}
            {activeGame === 'puzzle' && <DailyPuzzle user={user} />}
            {activeGame === 'xox' && <TicTacToe />}
            {activeGame === 'sudoku' && <Sudoku />}
        </div>
    )
}

function GameMenu({ onSelect }: { onSelect: (g: 'menu' | 'puzzle' | 'xox' | 'sudoku') => void }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
                onClick={() => onSelect('puzzle')}
                className="cursor-pointer group rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 hover:shadow-lg transition-all hover:scale-105"
            >
                <div className="text-4xl mb-4">🧩</div>
                <h3 className="font-bold text-lg mb-2">Günlük Bulmaca</h3>
                <p className="text-sm text-[rgb(var(--muted))]">Her gün yeni bir mantık sorusu. Doğru bilirsen <span className="text-[rgb(var(--accent))] font-bold">+10 Puan!</span></p>
            </div>

            <div
                onClick={() => onSelect('xox')}
                className="cursor-pointer group rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 hover:shadow-lg transition-all hover:scale-105"
            >
                <div className="text-4xl mb-4">⭕❌</div>
                <h3 className="font-bold text-lg mb-2">XOX (Tic-Tac-Toe)</h3>
                <p className="text-sm text-[rgb(var(--muted))]">Yapay zekaya karşı klasik XOX oyunu. Stratejini geliştir.</p>
            </div>

            <div
                onClick={() => onSelect('sudoku')}
                className="cursor-pointer group rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 hover:shadow-lg transition-all hover:scale-105"
            >
                <div className="text-4xl mb-4">🔢</div>
                <h3 className="font-bold text-lg mb-2">Sudoku</h3>
                <p className="text-sm text-[rgb(var(--muted))]">Zihnini açan sayı yerleştirme bulmacası. Her gün farklı kombinasyon.</p>
            </div>
        </div>
    )
}

// --- Daily Puzzle ---
const PUZZLES = [
    { q: "Bir baba 40, oğlu 10 yaşındadır. Kaç yıl sonra babanın yaşı oğlunun yaşının 3 katı olur?", a: "5", options: ["2", "5", "8", "10"] },
    { q: "Hangi sayı hem 2'ye hem 3'e tam bölünür?", a: "6", options: ["4", "5", "6", "8"] },
    { q: "Bir yarışta ikinciyi geçen kaçıncı olur?", a: "İkinci", options: ["Birinci", "İkinci", "Üçüncü", "Sonuncu"] },
    { q: "30'u yarıma bölüp 10 eklerseniz kaç elde edersiniz?", a: "70", options: ["25", "40", "55", "70"] },
    { q: "Bir ayda en fazla kaç pazar günü olabilir?", a: "5", options: ["3", "4", "5", "6"] },
    { q: "Doktorunuz size 3 hap verir ve bunları yarımşar saat arayla içmenizi söylerse, ilaçların bitmesi ne kadar sürer?", a: "1 saat", options: ["1 saat", "1.5 saat", "2 saat", "3 saat"] },
    { q: "Bir koşu yarışında üçüncüyü geçersen kaçıncı olursun?", a: "Üçüncü", options: ["Birinci", "İkinci", "Üçüncü", "Dördüncü"] },
    { q: "Hangi ayda 28 gün vardır?", a: "Hepsinde", options: ["Sadece Şubat", "Hepsinde", "Ocak", "Mart"] },
    { q: "Bir çiftçinin 17 koyunu vardı. Sürüde salgın hastalık oldu, dokuzu ağır hastalandı, diğerleri öldü. Çiftçinin kaç koyunu kaldı?", a: "9", options: ["8", "9", "17", "0"] },
    { q: "Bazı aylar 30, bazıları 31 çeker; kaç ayda 28 gün vardır?", a: "12", options: ["1", "12", "6", "10"] },
]

function DailyPuzzle({ user }: { user: any }) {
    const [puzzle, setPuzzle] = useState<any>(null)
    const [selected, setSelected] = useState<string | null>(null)
    const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
    const [alreadyPlayed, setAlreadyPlayed] = useState(false)

    useEffect(() => {
        // Pick puzzle based on date
        const dayIndex = new Date().getDate() % PUZZLES.length
        setPuzzle(PUZZLES[dayIndex])

        // Check local storage for today's play
        const todayStr = new Date().toDateString()
        const lastPlayed = localStorage.getItem(`daily_puzzle_${user?.id}`)
        if (lastPlayed === todayStr) {
            setAlreadyPlayed(true)
        }
    }, [user?.id])

    const handleCheck = async () => {
        if (!selected || alreadyPlayed || !user) return

        if (selected === puzzle.a) {
            setResult('correct')
            // Add points
            try {
                const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', user.id).single()
                const currentPoints = profile?.total_points || 0
                await supabase.from('profiles').update({ total_points: currentPoints + 10 }).eq('id', user.id)
            } catch (e) {
                console.error('Puan eklenemedi', e)
            }
        } else {
            setResult('wrong')
        }

        setAlreadyPlayed(true)
        localStorage.setItem(`daily_puzzle_${user.id}`, new Date().toDateString())
    }

    if (!puzzle) return <div>Yükleniyor...</div>

    return (
        <div className="max-w-xl mx-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
            <h2 className="text-xl font-bold mb-4">Günün Sorusu</h2>
            <p className="text-lg mb-6">{puzzle.q}</p>

            {alreadyPlayed && !result && (
                <div className="mb-4 p-3 bg-[rgb(var(--muted))]/10 rounded text-center text-[rgb(var(--muted))]">
                    Bugünkü şansını kullandın. Yarın tekrar gel!
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {puzzle.options.map((opt: string) => (
                    <button
                        key={opt}
                        onClick={() => !alreadyPlayed && setSelected(opt)}
                        className={`p-3 rounded-lg border text-left transition-all ${selected === opt
                                ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 ring-1 ring-[rgb(var(--accent))]'
                                : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]/5'
                            } ${alreadyPlayed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>

            {!alreadyPlayed && (
                <button
                    onClick={handleCheck}
                    disabled={!selected}
                    className="w-full py-2 bg-[rgb(var(--primary))] text-white rounded-lg font-medium disabled:opacity-50 btn-bounce"
                >
                    Cevabı Kontrol Et
                </button>
            )}

            {result === 'correct' && (
                <div className="mt-4 p-4 bg-green-500/10 text-green-600 rounded-lg text-center font-bold animate-in zoom-in">
                    Tebrikler! Doğru cevap. +10 Puan kazandın. 🎉
                </div>
            )}

            {result === 'wrong' && (
                <div className="mt-4 p-4 bg-red-500/10 text-red-600 rounded-lg text-center font-bold animate-in zoom-in">
                    Maalesef yanlış cevap. Doğru cevap: {puzzle.a}. Yarın tekrar dene.
                </div>
            )}
        </div>
    )
}

// --- Tic Tac Toe ---
function TicTacToe() {
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null))
    const [isXNext, setIsXNext] = useState(true) // User is X
    const winner = calculateWinner(board)

    const handleClick = (i: number) => {
        if (board[i] || winner || !isXNext) return
        const newBoard = [...board]
        newBoard[i] = 'X'
        setBoard(newBoard)
        setIsXNext(false)
    }

    // AI Move
    useEffect(() => {
        if (!isXNext && !winner) {
            const timer = setTimeout(() => {
                const emptyIndices = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[]
                if (emptyIndices.length > 0) {
                    // Simple AI: Random move
                    const rnd = Math.floor(Math.random() * emptyIndices.length)
                    const newBoard = [...board]
                    newBoard[emptyIndices[rnd]] = 'O'
                    setBoard(newBoard)
                    setIsXNext(true)
                }
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isXNext, winner, board])

    const resetGame = () => {
        setBoard(Array(9).fill(null))
        setIsXNext(true)
    }

    return (
        <div className="flex flex-col items-center">
            <div className="text-xl font-bold mb-4">
                {winner ? (winner === 'X' ? 'Kazandın! 🎉' : winner === 'O' ? 'Kaybettin 🤖' : 'Berabere!') : (isXNext ? 'Sıra Sende (X)' : 'Yapay Zeka Düşünüyor...')}
            </div>
            <div className="grid grid-cols-3 gap-2 bg-[rgb(var(--border))] p-2 rounded-xl">
                {board.map((cell, i) => (
                    <button
                        key={i}
                        onClick={() => handleClick(i)}
                        disabled={!isXNext || cell !== null || !!winner}
                        className="w-20 h-20 bg-[rgb(var(--card))] rounded-lg text-4xl font-bold flex items-center justify-center hover:bg-[rgb(var(--muted))]/10 transition-colors disabled:cursor-default text-[rgb(var(--foreground))]"
                    >
                        <span className={cell === 'X' ? 'text-[rgb(var(--accent))]' : 'text-red-500'}>{cell}</span>
                    </button>
                ))}
            </div>
            <button onClick={resetGame} className="mt-6 px-4 py-2 bg-[rgb(var(--primary))] text-white rounded-lg btn-bounce">
                Yeniden Oyna
            </button>
        </div>
    )
}

function calculateWinner(squares: (string | null)[]) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ]
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i]
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a]
        }
    }
    return squares.includes(null) ? null : 'Draw'
}

// --- Sudoku (Simplified) ---
// Valid solved board base
const SOLVED_BOARD = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
]

function Sudoku() {
    const [board, setBoard] = useState<(number | null)[][]>([])
    const [initialMask, setInitialMask] = useState<boolean[][]>([])
    const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)

    // Initialize new game
    useEffect(() => {
        newGame()
    }, [])

    const newGame = () => {
        // 1. Clone solved board
        let grid = SOLVED_BOARD.map(row => [...row])

        // 2. Simple shuffle (Permute numbers)
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        const map = new Map<number, number>()
        for (let i = 0; i < 9; i++) map.set(i + 1, nums[i])

        grid = grid.map(row => row.map(n => map.get(n)!))

        // 3. Mask cells (Easy mode: remove ~30 cells)
        const mask = Array(9).fill(null).map(() => Array(9).fill(true))
        const playableGrid = grid.map(row => [...row]) as (number | null)[][]

        let removed = 0
        while (removed < 30) {
            const r = Math.floor(Math.random() * 9)
            const c = Math.floor(Math.random() * 9)
            if (playableGrid[r][c] !== null) {
                playableGrid[r][c] = null
                mask[r][c] = false // Not fixed
                removed++
            }
        }

        setBoard(playableGrid)
        setInitialMask(mask)
        setSelectedCell(null)
    }

    const handleNumberInput = (num: number) => {
        if (!selectedCell) return
        const [r, c] = selectedCell
        if (initialMask[r][c]) return // Cannot edit fixed cells

        const newBoard = board.map(row => [...row])
        newBoard[r][c] = num
        setBoard(newBoard)
    }

    const handleClear = () => {
        if (!selectedCell) return
        const [r, c] = selectedCell
        if (initialMask[r][c]) return

        const newBoard = board.map(row => [...row])
        newBoard[r][c] = null
        setBoard(newBoard)
    }

    // Simplified internal logic for rendering
    if (board.length === 0) return <div>Yükleniyor...</div>

    return (
        <div className="flex flex-col items-center">
            <div className="mb-4 flex gap-4">
                <button onClick={newGame} className="px-4 py-2 bg-[rgb(var(--primary))] text-white rounded-lg btn-bounce">Yeni Oyun</button>
            </div>

            <div className="border-4 border-black inline-block bg-white shadow-xl">
                {board.map((row, r) => (
                    <div key={r} className="flex">
                        {row.map((val, c) => (
                            <div
                                key={c}
                                onClick={() => !initialMask[r][c] && setSelectedCell([r, c])}
                                className={`
                  w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border border-gray-300 cursor-pointer text-lg font-medium select-none
                  ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-black' : ''}
                  ${r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-black' : ''}
                  ${selectedCell?.[0] === r && selectedCell?.[1] === c ? 'bg-[rgb(var(--accent))]/30' : ''}
                  ${initialMask[r][c] ? 'bg-gray-100 text-black font-bold' : 'bg-white text-[rgb(var(--accent))]'}
                `}
                            >
                                {val}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-md">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button
                        key={n}
                        onClick={() => handleNumberInput(n)}
                        className="w-10 h-10 rounded bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--accent))] hover:text-white transition-colors"
                    >
                        {n}
                    </button>
                ))}
                <button
                    onClick={handleClear}
                    className="px-3 h-10 rounded bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
                >
                    Sil
                </button>
            </div>
        </div>
    )
}
